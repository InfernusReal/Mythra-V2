import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

async function fixture(page: Page) {
  await page.goto("/sign-in"); await page.getByRole("button", { name: "Continue to Mythra" }).click(); await page.waitForURL(/\/app$/u);
  return page.evaluate(async () => {
    const request = async <T>(url: string, body: unknown): Promise<T> => { const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const payload = await response.json() as { data?: T; error?: { message: string } }; if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? `${url} failed`); return payload.data; };
    const project = await request<{ id: string }>("/api/v2/projects", { title: `Agent seam ${Date.now()}` });
    const chapter = await request<{ chapter: { id: string } }>(`/api/v2/projects/${project.id}/chapters`, { title: "Tool chapter" });
    return { projectId: project.id, chapterId: chapter.chapter.id };
  });
}

test.describe("Sub-gate 17 agent application seam", () => {
  test.setTimeout(120_000);
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "chromium", "S17 protocol and author-review flow runs once in desktop Chromium."));

  test("lists bounded contracts, keeps proposals non-canonical, confirms metadata, and denies prose writes", async ({ page }) => {
    const emitted: string[] = []; page.on("console", (message) => emitted.push(message.text())); const data = await fixture(page);
    const proof = await page.evaluate(async ({ projectId, chapterId }) => {
      const call = async (id: string, name: string, args: Record<string, unknown>) => { const response = await fetch(`/api/v2/projects/${projectId}/tools`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments: args } }) }); return { status: response.status, payload: await response.json() }; };
      const listedResponse = await fetch(`/api/v2/projects/${projectId}/tools`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: "list", method: "tools/list", params: {} }) }); const listed = await listedResponse.json();
      const targetId = crypto.randomUUID(); const proposal = await call("proposal", "propose_structure_patch", { sourceAgent: "e2e.agent", idempotencyKey: "structure", finding: "Review a structural option.", expectedStructuralVersion: 1, targetType: "MILESTONE", targetId, operations: [{ operation: "replace", targetType: "MILESTONE", targetId, path: "/title", value: "Proposed only" }] });
      const causal = await call("causal", "propose_causal_relation", { sourceAgent: "e2e.agent", idempotencyKey: "causal", finding: "Review a causal option.", expectedStructuralVersion: 1, source: { type: "MILESTONE", id: crypto.randomUUID() }, target: { type: "CHAPTER_OUTLINE", id: crypto.randomUUID() }, relationType: "CAUSES" });
      const note = await call("note", "create_note", { authorConfirmed: true, idempotencyKey: "note", title: "Confirmed note", body: "Confirmed private metadata." });
      const capture = await call("capture", "create_capture", { authorConfirmed: true, clientCaptureId: crypto.randomUUID(), rawText: "Confirmed private capture.", route: location.pathname, chapterId, entityContext: [], capturedAt: new Date().toISOString() });
      const restricted = await call("restricted", "replace_prose_range", { authorConfirmed: true, chapterId, start: 0, length: 1, replacement: "x" });
      const causalOverview = await (await fetch(`/api/v2/projects/${projectId}/causality?nodeBudget=50&edgeBudget=50`)).json();
      return { listed, proposal, causal, note, capture, restricted, relationCount: causalOverview.data?.relations?.length ?? 0 };
    }, data);
    expect(proof.listed.result.tools).toHaveLength(20); const chapterTool = proof.listed.result.tools.find((tool: { name: string }) => tool.name === "get_chapter_text"); expect(chapterTool.inputSchema.properties.length.maximum).toBe(8_000); expect(chapterTool.outputSchema.required).toEqual(["projectStructuralVersion", "chapter", "range"]); expect(proof.proposal.status).toBe(200); expect(proof.causal.status).toBe(200); expect(proof.note.status).toBe(200); expect(proof.capture.status).toBe(200); expect(proof.restricted.status).toBe(403); expect(proof.relationCount).toBe(0);
    await page.goto(`/app/projects/${data.projectId}/suggestions`); const inbox = page.locator(".suggestion-inbox"); await expect(inbox.getByRole("heading", { name: "Suggestions" })).toBeVisible(); await expect(inbox.locator("li")).toHaveCount(2); await inbox.getByRole("button", { name: "Accept finding" }).first().click(); await expect(inbox.getByRole("status")).toContainText("Canonical story data was not changed");
    await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") }); const violations = await page.evaluate(async () => (await (window as typeof window & { axe: { run(): Promise<{ violations: Array<{ impact: string | null }> }> } }).axe.run()).violations.filter((item) => item.impact === "critical" || item.impact === "serious")); expect(violations).toEqual([]);
    await page.screenshot({ path: "test-results/agent-suggestions-desktop-light.png", fullPage: true }); await page.getByLabel("Theme").selectOption("dark", { force: true }); await expect(page.locator("html")).toHaveAttribute("data-theme", "dark"); await page.screenshot({ path: "test-results/agent-suggestions-desktop-dark.png", fullPage: true });
    const output = emitted.join("\n"); expect(output).toContain("S17-SUGGESTION-UI-001"); expect(output).not.toContain("Confirmed private metadata"); expect(output).not.toContain("Confirmed private capture");
  });
});

test("keeps author suggestion decisions usable in mobile Cream mode", async ({ page }, testInfo) => {
  test.setTimeout(120_000); test.skip(testInfo.project.name !== "mobile-chromium", "S17 responsive evidence runs in mobile Chromium."); const data = await fixture(page); await page.evaluate(async ({ projectId }) => { await fetch(`/api/v2/projects/${projectId}/suggestions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceAgent: "mobile.agent", idempotencyKey: "mobile", category: "usefulness", finding: "Review this bounded mobile suggestion." }) }); }, data); await page.goto(`/app/projects/${data.projectId}/suggestions`); await page.getByLabel("Theme").selectOption("cream", { force: true }); await expect(page.locator("html")).toHaveAttribute("data-theme", "cream"); await expect(page.getByRole("button", { name: "Mark intentional" })).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true); await page.screenshot({ path: "test-results/agent-suggestions-mobile-cream.png", fullPage: true });
});
