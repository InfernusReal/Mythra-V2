import { expect, test, type Page } from "@playwright/test";

async function fixture(page: Page) {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Continue to Mythra" }).click();
  await page.waitForURL(/\/app$/u);
  await page.getByLabel("Project title").fill(`S18 command fixture ${Date.now()}`);
  await page.getByRole("button", { name: "Write first chapter" }).click();
  await page.waitForURL(/\/app\/chapters\/[0-9a-f-]+$/u);
  const editor = page.getByRole("textbox", { name: "Chapter manuscript" });
  await expect(editor).toBeVisible();
  const projectHref = await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link").getAttribute("href");
  if (!projectHref) throw new Error("Fixture project coordinate missing.");
  return { editor, chapterUrl: page.url(), projectHref };
}

async function writingPosition(page: Page) {
  return page.evaluate(() => {
    const selection = window.getSelection();
    const block = (node: Node | null | undefined) => (node instanceof Element ? node : node?.parentElement)?.closest("[data-block-id]")?.getAttribute("data-block-id");
    return { anchor: selection?.anchorOffset, head: selection?.focusOffset, anchorBlock: block(selection?.anchorNode), headBlock: block(selection?.focusNode), scrollX: Math.round(window.scrollX), scrollY: Math.round(window.scrollY) };
  });
}

test.describe("S18 command compliance", () => {
  test.setTimeout(150_000);

  test("preserves exact writing position through palette and Capture on both device classes", async ({ page }, testInfo) => {
    const emitted: string[] = []; page.on("console", (message) => emitted.push(message.text()));
    const { editor, chapterUrl } = await fixture(page);
    const prose = "Synthetic private writing for command return. ".repeat(170);
    await editor.fill(prose);
    await expect(page.locator(".command-bar .save-status")).toHaveText("Saved", { timeout: 30_000 });
    await editor.focus(); await page.keyboard.press("Control+End");
    await page.keyboard.down("Shift"); for (let index = 0; index < 9; index++) await page.keyboard.press("ArrowLeft"); await page.keyboard.up("Shift");
    const before = await writingPosition(page);
    await page.keyboard.press("Control+K");
    const palette = page.getByRole("dialog", { name: "Command palette" });
    await expect(palette.getByRole("button", { name: /Save checkpoint/ })).toBeVisible();
    await expect(palette.getByRole("button", { name: "Create Entity from Selection" })).toBeVisible();
    await expect(palette.getByRole("button", { name: /Peek chapter outline/ })).toHaveCount(0);
    await page.keyboard.press("Escape"); await expect(editor).toBeFocused();
    await expect.poll(() => writingPosition(page)).toEqual(before);
    await page.keyboard.press("Control+K");
    await page.screenshot({ path: `test-results/s18-command-modal-${testInfo.project.name}.png` });
    await palette.getByRole("button", { name: /Quick Capture/ }).click();
    const capture = page.getByRole("dialog", { name: "Capture", exact: true }); await expect(capture).toBeVisible();
    await capture.getByRole("textbox", { name: "Thought" }).fill("Synthetic private capture draft");
    await page.keyboard.press("Escape"); await expect(editor).toBeFocused();
    await expect.poll(() => writingPosition(page)).toEqual(before);
    await expect(page).toHaveURL(chapterUrl); await expect(editor).toHaveText(prose.trim());
    const safeHistory = await page.evaluate(() => localStorage.getItem("mythra.commands.recent.v2"));
    expect(safeHistory).toContain("command:capture.open");
    expect(safeHistory).not.toContain("Synthetic");
    expect(emitted.join("\n")).not.toContain("Synthetic private capture draft");
    await page.screenshot({ path: `test-results/s18-command-return-${testInfo.project.name}.png`, fullPage: true });
  });

  test("executes checkpoint and Focus in place, protects modal Escape, and exposes route commands", async ({ page }, testInfo) => {
    const { editor, chapterUrl, projectHref } = await fixture(page);
    await editor.fill("Synthetic checkpoint content"); await expect(page.locator(".command-bar .save-status")).toHaveText("Saved", { timeout: 30_000 });
    await page.keyboard.press("Control+K"); const palette = page.getByRole("dialog", { name: "Command palette" });
    const checkpoint = page.waitForResponse((response) => response.url().endsWith("/checkpoint") && response.request().method() === "POST" && response.ok());
    await palette.getByRole("textbox").fill("save checkpoint"); await page.keyboard.press("Enter"); await checkpoint;
    await expect(page.locator(".command-bar .save-status")).toHaveText("Saved"); await expect(page).toHaveURL(chapterUrl);
    await page.keyboard.press("Control+K"); await palette.getByRole("button", { name: /Toggle Focus/ }).click();
    await expect(page.locator(".editor-layout")).toHaveClass(/focus-mode/u);
    await page.keyboard.press("Control+K"); await page.keyboard.press("Escape");
    await expect(page.locator(".editor-layout")).toHaveClass(/focus-mode/u);
    await page.keyboard.press("Escape"); await expect(page.locator(".editor-layout")).not.toHaveClass(/focus-mode/u);
    await page.keyboard.press("Control+K");
    for (const label of ["Open Structure", "Open Universe", "Open Timeline", "Open Notes", "Open Research", "Open Capture Inbox", "Open Suggestions", "Open full Search"]) await expect(palette.getByRole("link", { name: label, exact: true })).toBeVisible();
    await palette.getByRole("button", { name: "Add consequence", exact: true }).click();
    const causal = page.getByRole("dialog", { name: "Connect this manuscript moment" });
    await expect(causal.getByRole("combobox", { name: "Phrase" })).toHaveValue("CAUSES");
    await page.keyboard.press("Escape"); await expect(editor).toBeFocused();
    await page.goto(projectHref); await page.keyboard.press("Control+K");
    await expect(palette.getByRole("button", { name: "Continue Writing", exact: true })).toBeVisible();
    await expect(palette.getByRole("button", { name: "Create verified snapshot", exact: true })).toBeVisible();
    await expect(palette.getByRole("button", { name: /Toggle Focus/ })).toHaveCount(0);
    await palette.getByRole("button", { name: "Continue Writing", exact: true }).click();
    await expect(page).toHaveURL(chapterUrl); await expect(editor).toHaveText("Synthetic checkpoint content");
    await page.screenshot({ path: `test-results/s18-command-execution-${testInfo.project.name}.png`, fullPage: true });
  });
});
