import { expect, test, type BrowserContext, type Page } from "@playwright/test";

async function signIn(page: Page): Promise<void> {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Continue to Mythra" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

async function createChapter(page: Page, title: string): Promise<string> {
  await signIn(page);
  await page.getByLabel("Project title").fill(title);
  await page.getByRole("button", { name: "Write first chapter" }).click();
  await expect(page).toHaveURL(/\/app\/chapters\/[0-9a-f-]+$/, { timeout: 20_000 });
  return page.url();
}

async function expectSaved(page: Page): Promise<void> {
  await expect(page.locator(".command-bar .save-status")).toHaveText("Saved", { timeout: 15_000 });
}

async function shareSession(source: BrowserContext, target: BrowserContext): Promise<void> {
  await target.addCookies(await source.cookies());
}

test.describe("Sub-gate 2 never-lose-text durability", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Durability failure paths run once in desktop Chromium.");
  });

  test("autosaves a structured Unicode draft and reloads canonical content", async ({ page }) => {
    const url = await createChapter(page, `Durable reload ${Date.now()}`);
    const editor = page.getByRole("textbox", { name: "Chapter manuscript" });
    const text = "Durable \u4e16\u754c \u0645\u0631\u062d\u0628\u0627";
    await editor.fill(text);
    await expectSaved(page);
    await page.reload();
    await expect(page).toHaveURL(url);
    await expect(page.getByRole("textbox", { name: "Chapter manuscript" })).toContainText(text);
    await expectSaved(page);
  });

  test("recovers the IndexedDB journal after failed acknowledgement and page close", async ({ page, context }) => {
    const url = await createChapter(page, `Journal recovery ${Date.now()}`);
    await page.route("**/api/v2/chapters/*/draft", (route) => route.abort("failed"));
    const text = "Local text before acknowledgement";
    await page.getByRole("textbox", { name: "Chapter manuscript" }).fill(text);
    await expect(page.locator(".command-bar .save-status")).toContainText(/Offline|Saved locally/, { timeout: 10_000 });
    await page.waitForTimeout(150);
    await page.close();

    const recoveryPage = await context.newPage();
    await recoveryPage.goto(url);
    await expect(recoveryPage.getByRole("textbox", { name: "Chapter manuscript" })).toContainText(text);
    await expect(recoveryPage.locator(".command-bar .save-status")).toContainText(/Recovered local draft|Saved/, { timeout: 10_000 });
    await expectSaved(recoveryPage);
  });

  test("recovers a journal when the page closes before the server acknowledges", async ({ page, context }) => {
    const url = await createChapter(page, `Close before ack ${Date.now()}`);
    await page.route("**/api/v2/chapters/*/draft", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      await route.continue().catch(() => undefined);
    });
    const text = "Text while acknowledgement is pending";
    await page.getByRole("textbox", { name: "Chapter manuscript" }).fill(text);
    await expect(page.locator(".command-bar .save-status")).toContainText("Saving", { timeout: 10_000 });
    await page.close();

    const recoveryPage = await context.newPage();
    await recoveryPage.goto(url);
    await expect(recoveryPage.getByRole("textbox", { name: "Chapter manuscript" })).toContainText(text);
    await expectSaved(recoveryPage);
  });

  test("retains offline edits and retries when connectivity returns", async ({ page, context }) => {
    await createChapter(page, `Offline retry ${Date.now()}`);
    await context.setOffline(true);
    await page.getByRole("textbox", { name: "Chapter manuscript" }).fill("Offline retained text");
    await expect(page.locator(".command-bar .save-status")).toContainText("Offline", { timeout: 10_000 });
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await expectSaved(page);
    await page.reload();
    await expect(page.getByRole("textbox", { name: "Chapter manuscript" })).toContainText("Offline retained text");
  });

  test("preserves both device variants and applies an explicit Keep Local resolution", async ({ browser, page, context }) => {
    const url = await createChapter(page, `Conflict ${Date.now()}`);
    const secondContext = await browser.newContext();
    await shareSession(context, secondContext);
    const secondPage = await secondContext.newPage();
    await secondPage.goto(url);

    await page.getByRole("textbox", { name: "Chapter manuscript" }).fill("Server device variant");
    await expectSaved(page);
    await secondPage.getByRole("textbox", { name: "Chapter manuscript" }).fill("Local device variant");
    await expect(secondPage.getByRole("heading", { name: "Two versions need your choice" })).toBeVisible({ timeout: 15_000 });
    await secondPage.getByRole("button", { name: "Compare" }).click();
    await expect(secondPage.getByRole("button", { name: "Keep server" })).toBeVisible();
    await expect(secondPage.getByRole("button", { name: "Duplicate as recovery copy" })).toBeVisible();
    const compare = secondPage.locator(".revision-compare");
    await expect(compare.getByText("Server device variant")).toBeVisible();
    await expect(compare.getByText("Local device variant")).toBeVisible();
    await secondPage.getByRole("button", { name: "Keep local as new version" }).click();
    await expectSaved(secondPage);
    await secondPage.reload();
    await expect(secondPage.getByRole("textbox", { name: "Chapter manuscript" })).toContainText("Local device variant");
    await secondContext.close();
  });

  test("creates one explicit checkpoint for Ctrl+S and redacts document content from console", async ({ page }) => {
    const emitted: string[] = [];
    page.on("console", (message) => emitted.push(message.text()));
    await createChapter(page, `Checkpoint ${Date.now()}`);
    const privateText = "Private checkpoint manuscript";
    await page.getByRole("textbox", { name: "Chapter manuscript" }).fill(privateText);
    await expectSaved(page);
    await page.keyboard.press("Control+S");
    await expect.poll(() => emitted.some((entry) => entry.includes("checkpoint.acknowledged")), { timeout: 15_000 }).toBe(true);
    expect(emitted.join("\n")).not.toContain(privateText);
  });
});
