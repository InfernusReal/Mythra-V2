import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

async function signIn(page: Page): Promise<void> {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Continue to Mythra" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

async function createFirstChapter(page: Page, title: string): Promise<{ chapterUrl: string; projectUrl: string }> {
  await signIn(page);
  await page.getByLabel("Project title").fill(title);
  await page.getByRole("button", { name: "Write first chapter" }).click();
  await expect(page).toHaveURL(/\/app\/chapters\/[0-9a-f-]+$/, { timeout: 20_000 });
  const projectUrl = await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link").getAttribute("href");
  if (!projectUrl) throw new Error("Project Home URL was not available.");
  return { chapterUrl: page.url(), projectUrl };
}

async function selectionFacts(page: Page) {
  return page.evaluate(() => {
    const selection = window.getSelection();
    const element = selection?.anchorNode instanceof Element ? selection.anchorNode : selection?.anchorNode?.parentElement;
    return { offset: selection?.anchorOffset ?? -1, blockId: element?.closest("[data-block-id]")?.getAttribute("data-block-id") ?? null, scrollTop: Math.round(window.scrollY) };
  });
}

test.describe("Sub-gate 3 exact continuation", () => {
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "chromium", "Continuation state is verified once in desktop Chromium."));

  test("returns through Project Home to the exact active block, cursor, and scroll anchor", async ({ page }) => {
    const emitted: string[] = [];
    page.on("console", (message) => emitted.push(message.text()));
    const privateText = `Continuation private ${Date.now()}`;
    const { chapterUrl, projectUrl } = await createFirstChapter(page, `Continuation ${Date.now()}`);
    const editor = page.getByRole("textbox", { name: "Chapter manuscript" });
    await editor.fill(privateText);
    for (let index = 0; index < 36; index += 1) { await page.keyboard.press("Enter"); await page.keyboard.type(`Paragraph ${index}`); }
    await expect(page.locator(".command-bar .save-status")).toHaveText("Saved", { timeout: 15_000 });
    const target = page.locator(".editor-prose p").nth(22);
    await target.click();
    await page.keyboard.press("End");
    await page.keyboard.press("ArrowLeft");
    await page.evaluate(() => window.scrollTo(0, 560));
    const saved = page.waitForResponse((response) => response.url().includes("/continuation") && response.request().method() === "PUT" && response.ok());
    await page.keyboard.press("ArrowLeft");
    await saved;
    const before = await selectionFacts(page);
    expect(before.blockId).toMatch(/^[0-9a-f-]{36}$/);
    await page.goto(projectUrl);
    await expect(page).toHaveURL(new RegExp(`${projectUrl}$`));
    await expect(page.getByRole("link", { name: "Continue Writing" })).toHaveAttribute("href", new URL(chapterUrl).pathname);
    await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") });
    const violations = await page.evaluate(async () => {
      const axe = (window as typeof window & { axe: { run(): Promise<{ violations: Array<{ impact: string | null }> }> } }).axe;
      return (await axe.run()).violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious");
    });
    expect(violations).toEqual([]);
    await page.screenshot({ path: "test-results/continuation-project-home.png", fullPage: true });
    const priorRestoreCount = emitted.filter((entry) => entry.includes("S3-CLIENT-002")).length;
    await page.getByRole("link", { name: "Continue Writing" }).click();
    await expect(page).toHaveURL(chapterUrl);
    await expect.poll(() => emitted.filter((entry) => entry.includes("S3-CLIENT-002")).length, { timeout: 10_000 }).toBeGreaterThan(priorRestoreCount);
    const after = await selectionFacts(page);
    expect(after.blockId).toBe(before.blockId);
    expect(after.offset).toBe(before.offset);
    expect(Math.abs(after.scrollTop - before.scrollTop)).toBeLessThanOrEqual(2);
    expect(emitted.join("\n")).not.toContain(privateText);
    await page.screenshot({ path: "test-results/continuation-restored-editor.png", fullPage: true });
  });

  test("uses metadata-only local continuation when server position writes are unavailable", async ({ page }) => {
    const emitted: string[] = [];
    page.on("console", (message) => emitted.push(message.text()));
    const { projectUrl } = await createFirstChapter(page, `Local continuation ${Date.now()}`);
    await page.route("**/api/v2/projects/*/continuation", (route) => route.request().method() === "PUT" ? route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "DEPENDENCY_UNAVAILABLE", message: "Unavailable" } }) }) : route.continue());
    const editor = page.getByRole("textbox", { name: "Chapter manuscript" });
    await editor.fill("Local continuation content");
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(750);
    const before = await selectionFacts(page);
    await page.goto(projectUrl);
    await page.getByRole("link", { name: "Continue Writing" }).click();
    await expect.poll(() => emitted.some((entry) => entry.includes('"source":"local"')), { timeout: 10_000 }).toBe(true);
    const after = await selectionFacts(page);
    expect(after.blockId).toBe(before.blockId);
    expect(after.offset).toBe(before.offset);
    expect(emitted.join("\n")).not.toContain("Local continuation content");
  });

  test("gives an empty project one unambiguous first-chapter action", async ({ page }) => {
    await signIn(page);
    const projectId = await page.evaluate(async () => {
      const response = await fetch("/api/v2/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: "Empty continuation project" }) });
      const envelope = await response.json() as { data: { id: string } };
      return envelope.data.id;
    });
    await page.goto(`/app/projects/${projectId}`);
    await expect(page.getByRole("heading", { name: "No chapters yet" })).toBeVisible();
    await page.getByRole("button", { name: "Write first chapter" }).click();
    await expect(page).toHaveURL(/\/app\/chapters\/[0-9a-f-]+$/, { timeout: 20_000 });
    await expect(page.getByRole("textbox", { name: "Chapter manuscript" })).toBeVisible();
  });
});

test("renders a dominant Continue Writing action on mobile Dark Project Home", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobile continuation layout runs in the mobile project.");
  const { projectUrl } = await createFirstChapter(page, `Mobile continuation ${Date.now()}`);
  await page.goto(projectUrl);
  await page.locator('select[aria-label="Theme"]').selectOption("dark", { force: true });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("link", { name: "Continue Writing" })).toBeVisible();
  await page.screenshot({ path: "test-results/continuation-project-home-mobile.png", fullPage: true });
});
