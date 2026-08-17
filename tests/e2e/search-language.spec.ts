import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

async function fixture(page: Page) {
  await page.goto("/sign-in"); await page.getByRole("button", { name: "Continue to Mythra" }).click(); await page.waitForURL(/\/app$/u);
  return page.evaluate(async () => {
    const request = async <T>(url: string, method: string, body?: unknown): Promise<T> => { const response = await fetch(url, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined }); const envelope = await response.json() as { data?: T; error?: { message: string } }; if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? `${method} ${url} failed`); return envelope.data; };
    const project = await request<{ id: string }>("/api/v2/projects", "POST", { title: `Search ${Date.now()}` }); const chapter = await request<{ chapter: { id: string } }>(`/api/v2/projects/${project.id}/chapters`, "POST", { title: "Aurora arrival" });
    await request("/api/v2/captures", "POST", { clientCaptureId: crypto.randomUUID(), projectId: project.id, rawText: "Aurora capture reference", route: `/app/chapters/${chapter.chapter.id}`, chapterId: chapter.chapter.id, entityContext: [], capturedAt: new Date().toISOString() });
    return { projectId: project.id, chapterId: chapter.chapter.id };
  });
}

test.describe("Sub-gate 10 Search + Language", () => {
  test.setTimeout(150_000);
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "chromium", "S10 desktop flows run once in desktop Chromium."));

  test("retrieves current project objects in Cmd/Ctrl+K and preserves Peek, block-return and causal action semantics", async ({ page }) => {
    const emitted: string[] = []; page.on("console", (message) => emitted.push(message.text())); const data = await fixture(page); await page.goto(`/app/chapters/${data.chapterId}`);
    const editor = page.getByRole("textbox", { name: "Chapter manuscript" }); await editor.fill("good Aurora returns at dawn"); await expect(page.locator(".command-bar .save-status")).toHaveText("Saved", { timeout: 20_000 }); await editor.focus(); await page.keyboard.press("End");
    await page.keyboard.press("Control+K"); const palette = page.getByRole("dialog", { name: "Command palette" }); await palette.getByRole("textbox", { name: "Search commands and project objects" }).fill("Aurora"); await expect(palette.getByRole("heading", { name: "Chapters" })).toBeVisible({ timeout: 30_000 }); await expect(palette.getByText("good Aurora returns at dawn")).toBeVisible();
    const historyLength = await page.evaluate(() => window.history.length); await palette.getByRole("button", { name: "Peek" }).first().click(); await expect(palette.getByRole("heading", { name: "Aurora arrival" })).toBeVisible(); expect(await page.evaluate(() => window.history.length)).toBe(historyLength); await palette.getByRole("button", { name: "Return to results" }).click();
    await palette.getByRole("button", { name: "Why does this happen?" }).first().click(); await expect(palette.getByText(/bounded paths/u)).toBeVisible(); await palette.getByRole("button", { name: "Jump to block" }).first().click(); await expect(page.getByRole("button", { name: "Return to search origin" })).toBeVisible(); await page.keyboard.press("Escape"); await page.getByRole("button", { name: "Return to search origin" }).click(); await expect(editor).toBeFocused();
    expect(emitted.join("\n")).toContain("S10-UI-009"); expect(emitted.join("\n")).toContain("S10-UI-010"); expect(emitted.join("\n")).toContain("S10-UI-005"); expect(emitted.join("\n")).toContain("S10-UI-003");
  });

  test("shows deterministic Language data, replaces in one click, preserves undo and saves vocabulary", async ({ page }) => {
    const emitted: string[] = []; page.on("console", (message) => emitted.push(message.text())); const data = await fixture(page); await page.goto(`/app/chapters/${data.chapterId}`); const editor = page.getByRole("textbox", { name: "Chapter manuscript" }); await editor.fill("good path remains"); await expect(page.locator(".command-bar .save-status")).toHaveText("Saved", { timeout: 20_000 }); await editor.focus(); await page.keyboard.press("Home"); await page.keyboard.down("Shift"); for (let index = 0; index < 4; index += 1) await page.keyboard.press("ArrowRight"); await page.keyboard.up("Shift");
    const card = page.getByRole("complementary", { name: "Language" }); await expect(card).toBeVisible({ timeout: 30_000 }); await expect(card.getByText(/adjective|noun|adverb/iu).first()).toBeVisible(); const replacement = card.locator(".language-words button").first(); const replacementText = await replacement.textContent(); expect(replacementText).toBeTruthy(); await replacement.click(); await expect(editor).not.toHaveText("good path remains"); await editor.press("Control+z"); await expect(editor).toHaveText("good path remains");
    await editor.focus(); await page.keyboard.press("Home"); await page.keyboard.down("Shift"); for (let index = 0; index < 4; index += 1) await page.keyboard.press("ArrowRight"); await page.keyboard.up("Shift"); await expect(card).toBeVisible(); await card.getByRole("button", { name: "Save vocabulary" }).click(); await expect(card.getByRole("button", { name: "Remove from saved vocabulary" })).toBeVisible();
    expect(emitted.join("\n")).toContain("S10-UI-006"); expect(emitted.join("\n")).toContain("S10-UI-007"); expect(emitted.join("\n")).toContain("S10-UI-008");
  });

  test("supports full Search, dormant-provider labeling, accessibility and desktop visual review", async ({ page }) => {
    const data = await fixture(page); await page.goto(`/app/chapters/${data.chapterId}`); const editor = page.getByRole("textbox", { name: "Chapter manuscript" }); await editor.fill("Aurora visual search text"); await expect(page.locator(".command-bar .save-status")).toHaveText("Saved", { timeout: 20_000 }); await page.goto(`/app/projects/${data.projectId}/search?returnChapterId=${data.chapterId}`); await page.getByRole("textbox").fill("Aurora"); await expect(page.getByRole("heading", { name: "Chapters" })).toBeVisible({ timeout: 30_000 }); await expect(page.getByText(/Timeline events, Notes, and Research activate/u)).toBeVisible(); await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") }); const violations = await page.evaluate(async () => (await (window as typeof window & { axe: { run(): Promise<{ violations: Array<{ impact: string | null }> }> } }).axe.run()).violations.filter((item) => item.impact === "critical" || item.impact === "serious")); expect(violations).toEqual([]); await page.screenshot({ path: "test-results/search-language-desktop.png", fullPage: true });
  });
});

test("keeps full Search usable on mobile", async ({ page }, testInfo) => {
  test.setTimeout(120_000); test.skip(testInfo.project.name !== "mobile-chromium", "S10 mobile flow runs in mobile Chromium."); const data = await fixture(page); await page.goto(`/app/projects/${data.projectId}/search?returnChapterId=${data.chapterId}`); await page.getByRole("textbox").fill("Aurora"); await expect(page.getByRole("heading", { name: /Chapters|Captures/u }).first()).toBeVisible({ timeout: 30_000 }); await page.screenshot({ path: "test-results/search-language-mobile.png", fullPage: true });
});
