import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

async function fixture(page: Page) {
  await page.goto("/sign-in"); await page.getByRole("button", { name: "Continue to Mythra" }).click(); await page.waitForURL(/\/app$/u);
  return page.evaluate(async () => {
    const request = async <T>(url: string, body: unknown): Promise<T> => { const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const envelope = await response.json() as { data?: T; error?: { message: string } }; if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? `${url} failed`); return envelope.data; };
    const project = await request<{ id: string }>("/api/v2/projects", { title: `Live Model ${Date.now()}` }); const chapter = await request<{ chapter: { id: string } }>(`/api/v2/projects/${project.id}/chapters`, { title: "Writable chapter" });
    return { projectId: project.id, chapterId: chapter.chapter.id };
  });
}

test.describe("Sub-gate 12 Live Story Model", () => {
  test.setTimeout(180_000);
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "chromium", "S12 primary flows run once in desktop Chromium."));

  test("shows truthful freshness, repairs from canonical data, and surfaces neutral causal facts", async ({ page }) => {
    const emitted: string[] = []; page.on("console", (message) => emitted.push(message.text())); const data = await fixture(page);
    await page.goto(`/app/projects/${data.projectId}`); await expect(page.getByRole("status").filter({ hasText: "Story model updating" })).toBeVisible();
    await page.getByRole("button", { name: "Repair from canonical data" }).click(); await expect(page.getByRole("status").filter({ hasText: "Story model current" })).toBeVisible({ timeout: 30_000 });
    const facts = await page.evaluate(async ({ projectId }) => {
      const post = async <T>(url: string, body: unknown): Promise<T> => { const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const envelope = await response.json() as { data?: T; error?: { message: string } }; if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? `${url} failed`); return envelope.data; };
      const cause = await post<{ object: { id: string }; projectStructuralVersion: number }>(`/api/v2/projects/${projectId}/causality/story-changes`, { expectedStructuralVersion: 1, kind: "EVENT", title: "Cause", storyTime: 2, isPlaceholder: false });
      const effect = await post<{ object: { id: string }; projectStructuralVersion: number }>(`/api/v2/projects/${projectId}/causality/story-changes`, { expectedStructuralVersion: cause.projectStructuralVersion, kind: "OUTCOME", title: "Effect", storyTime: 1, isPlaceholder: false });
      const relation = await post<{ object: { id: string }; projectStructuralVersion: number }>(`/api/v2/projects/${projectId}/causality/relations`, { expectedStructuralVersion: effect.projectStructuralVersion, source: { type: "STORY_CHANGE", id: cause.object.id }, target: { type: "STORY_CHANGE", id: effect.object.id }, relationType: "CAUSES" });
      return { causeId: cause.object.id, effectId: effect.object.id, relationId: relation.object.id, structuralVersion: relation.projectStructuralVersion };
    }, data);
    expect(facts.structuralVersion).toBe(4); await page.reload(); await expect(page.getByRole("status").filter({ hasText: "Story model updating" })).toBeVisible();
    await page.getByRole("button", { name: "Repair from canonical data" }).click(); await expect(page.getByRole("status").filter({ hasText: "Story model current" })).toBeVisible({ timeout: 30_000 });
    await page.getByText(/factual warning/iu).click(); await expect(page.getByText("An explicit cause appears after its effect in comparable story time.")).toBeVisible();
    await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") }); const violations = await page.evaluate(async () => (await (window as typeof window & { axe: { run(): Promise<{ violations: Array<{ impact: string | null }> }> } }).axe.run()).violations.filter((item) => item.impact === "critical" || item.impact === "serious")); expect(violations).toEqual([]);
    expect(emitted.join("\n")).toContain("S12-UI-001"); expect(emitted.join("\n")).toContain("S12-UI-003"); await page.screenshot({ path: "test-results/live-model-desktop.png", fullPage: true });
  });

  test("keeps manuscript writing available when Live Model support fails", async ({ page }) => {
    const data = await fixture(page); await page.route(`**/api/v2/projects/${data.projectId}/live-model`, (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "DEPENDENCY_UNAVAILABLE" } }) }));
    await page.goto(`/app/chapters/${data.chapterId}`); await expect(page.getByRole("status").filter({ hasText: "Story model unavailable" })).toBeVisible(); const editor = page.getByRole("textbox", { name: "Chapter manuscript" }); await editor.fill("Writing continues while supporting projections are unavailable."); await expect(editor).toContainText("Writing continues");
  });
});

test("keeps Live Model freshness usable on mobile Dark theme", async ({ page }, testInfo) => {
  test.setTimeout(120_000); test.skip(testInfo.project.name !== "mobile-chromium", "S12 mobile evidence runs in mobile Chromium."); const data = await fixture(page); await page.goto(`/app/projects/${data.projectId}`); await page.getByLabel("Theme").selectOption("dark", { force: true }); await expect(page.locator("html")).toHaveAttribute("data-theme", "dark"); await expect(page.getByRole("status").filter({ hasText: "Story model updating" })).toBeVisible(); await page.screenshot({ path: "test-results/live-model-mobile-dark.png", fullPage: true });
});
