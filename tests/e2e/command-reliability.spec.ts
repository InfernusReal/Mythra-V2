import { expect, test, type Page } from "@playwright/test";
import { earlyCommandIntentScript } from "../../lib/commands/early-intent";

async function fixture(page: Page) {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Continue to Mythra" }).click();
  await page.waitForURL(/\/app$/u);
  await page.getByLabel("Project title").fill(`Synthetic reliability ${Date.now()}`);
  await page.getByRole("button", { name: "Write first chapter" }).click();
  await page.waitForURL(/\/app\/chapters\/[0-9a-f-]+$/u);
  const editor = page.getByRole("textbox", { name: "Chapter manuscript" }); await expect(editor).toBeVisible();
  const project = await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link").getAttribute("href");
  if (!project) throw new Error("Synthetic project coordinate missing");
  return { editor, project, chapter: new URL(page.url()).pathname };
}

test.describe("authorized command/Capture reliability regression", () => {
  test.setTimeout(150_000);
  test("claims the real bootstrap's early keyboard intent while application chunks are deliberately held", async ({ page }) => {
    const { project, chapter } = await fixture(page);
    const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.name));
    // Execute the exact production inline bootstrap before holding hydration, not an alternate test handler.
    await page.addInitScript(earlyCommandIntentScript);
    let release!: () => void;
    const barrier = new Promise<void>((resolve) => { release = resolve; });
    await page.route("**/_next/static/chunks/**", async (route) => { await barrier; await route.continue(); });
    try {
      await page.goto(`${project}/structure?returnChapterId=${chapter.split("/").at(-1)}`, { waitUntil: "commit" });
      await page.waitForFunction(() => Boolean(window.__mythraCommandIntentV1));
      await page.keyboard.press("Control+K");
      expect(await page.evaluate(() => window.__mythraCommandIntentV1?.pendingAt !== null)).toBe(true);
      await expect(page.getByRole("dialog", { name: "Command palette" })).toHaveCount(0);
    } finally { release(); }
    const palette = page.getByRole("dialog", { name: "Command palette" }); await expect(palette).toBeVisible();
    await expect(palette.getByRole("link", { name: "Continue Writing", exact: true })).toHaveAttribute("href", chapter);
    await expect(palette).toHaveCount(1); expect(errors).toEqual([]);
    await page.unroute("**/_next/static/chunks/**");
  });

  test("preserves native forward/backward/caret coordinates when Ctrl+K is dispatched in the same task", async ({ page }) => {
    const { editor, chapter } = await fixture(page);
    const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.name));
    const prose = "Synthetic reliability selection. ".repeat(200);
    await editor.fill(prose); await expect(page.locator(".command-bar .save-status")).toHaveText("Saved", { timeout: 30_000 });
    for (const [anchor, head] of [[6200, 6191], [6191, 6200], [6200, 6200]]) {
      await editor.focus(); await page.keyboard.press("Control+End");
      const before = await page.evaluate(({ anchor, head }) => {
        const text = document.querySelector('[aria-label="Chapter manuscript"] p')!.firstChild!;
        window.getSelection()!.setBaseAndExtent(text, anchor, text, head);
        const snapshot = { anchor, head, scrollX: Math.round(scrollX), scrollY: Math.round(scrollY) };
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true, cancelable: true }));
        return snapshot;
      }, { anchor: anchor!, head: head! });
      const palette = page.getByRole("dialog", { name: "Command palette" }); await expect(palette).toBeVisible();
      await page.keyboard.press("Escape"); await expect(editor).toBeFocused();
      const position = () => page.evaluate(() => ({ anchor: getSelection()!.anchorOffset, head: getSelection()!.focusOffset, scrollX: Math.round(scrollX), scrollY: Math.round(scrollY) }));
      await expect.poll(position).toEqual(before);
      await page.keyboard.press("Control+K"); await palette.getByRole("button", { name: /Quick Capture/u }).click();
      await expect(page.getByRole("dialog", { name: "Capture", exact: true })).toBeVisible();
      await page.keyboard.press("Escape"); await expect(editor).toBeFocused();
      await expect.poll(position).toEqual(before);
    }
    await expect(page).toHaveURL(new RegExp(`${chapter}$`, "u"));
    await expect(editor).toHaveText(prose.trim()); expect(errors).toEqual([]);
  });
});
