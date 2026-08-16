import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

async function createProject(page: Page, withChapter = true) {
  await page.goto("/sign-in"); await page.getByRole("button", { name: "Continue to Mythra" }).click();
  return page.evaluate(async ({ chapter }) => {
    const projectResponse = await fetch("/api/v2/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: `Causality ${Date.now()}` }) }); const project = await projectResponse.json() as { data: { id: string } };
    if (!chapter) return { projectId: project.data.id, chapterId: null };
    const chapterResponse = await fetch(`/api/v2/projects/${project.data.id}/chapters`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: "Chapter one" }) }); const created = await chapterResponse.json() as { data: { chapter: { id: string } } };
    return { projectId: project.data.id, chapterId: created.data.chapter.id };
  }, { chapter: withChapter });
}

test.describe("Sub-gate 6 Causal Story Fabric", () => {
  test.setTimeout(120_000);
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "chromium", "S6 primary flows run once in desktop Chromium."));

  test("keeps zero causality optional, composes A causes B, traces and checks neutral chronology", async ({ page }) => {
    const emitted: string[] = []; page.on("console", (message) => emitted.push(message.text())); const { projectId } = await createProject(page);
    await page.goto(`/app/projects/${projectId}/structure`); await page.getByRole("button", { name: "Causal", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Because and consequence" })).toBeVisible(); await expect(page.getByRole("heading", { name: "Causal relationships" })).toHaveCount(0); await expect(page.locator(".causal-lens [role=alert]")).toHaveCount(0);
    await page.getByRole("textbox", { name: "Change", exact: true }).fill("Door opens"); await page.getByLabel("Story time (optional)", { exact: true }).fill("2"); const firstResponse = page.waitForResponse((response) => response.url().endsWith("/causality/story-changes") && response.status() === 201); await page.getByRole("button", { name: "Add Story Change" }).click(); await firstResponse; await expect(page.getByText("Version 2. Planning remains optional.")).toBeVisible();
    await page.getByRole("textbox", { name: "Change", exact: true }).fill("Alarm sounds"); await page.getByLabel("Story time (optional)", { exact: true }).fill("1"); const secondResponse = page.waitForResponse((response) => response.url().endsWith("/causality/story-changes") && response.status() === 201); await page.getByRole("button", { name: "Add Story Change" }).click(); await secondResponse; await expect(page.getByText("Version 3. Planning remains optional.")).toBeVisible();
    const relationForm = page.locator("form.causal-form").filter({ has: page.getByRole("heading", { name: "Cause and effect" }) }); await relationForm.locator("select").nth(0).selectOption({ index: 1 }); await relationForm.locator("select").nth(2).selectOption({ index: 0 }); await relationForm.locator('select[name="phrase"]').selectOption("CAUSES"); await relationForm.locator('input[name="condition"]').fill("Only when the latch breaks"); await relationForm.locator('textarea[name="note"]').fill("Author-confirmed relation");
    const relationResponse = page.waitForResponse((response) => response.url().endsWith("/causality/relations") && response.status() === 201); await page.getByRole("button", { name: "Record causal relation" }).click(); await relationResponse; await expect(page.getByRole("heading", { name: "Causal relationships" })).toBeVisible(); await expect(page.getByText("Condition: Only when the latch breaks")).toBeVisible();
    await page.getByRole("button", { name: "What changes?" }).click(); await expect(page.getByText(/potentially affected paths/)).toBeVisible(); await expect(page.getByText(/causes \[direct\]/)).toBeVisible();
    await page.getByRole("button", { name: "Check chronology" }).click(); await expect(page.getByRole("status").filter({ hasText: "warning using story time" })).toContainText("Confirm a flashback or feedback-loop interpretation");
    expect(emitted.join("\n")).toContain("S6-UI-001"); expect(emitted.join("\n")).toContain("S6-UI-002"); expect(emitted.join("\n")).toContain("S6-UI-003"); expect(emitted.join("\n")).toContain("S6-UI-008");
  });

  test("rejects reserved adapters and an unqualified hard requires cycle with stable results", async ({ page }) => {
    const { projectId } = await createProject(page, false);
    const facts = await page.evaluate(async (id) => {
      const post = async (url: string, body: unknown) => { const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); return { status: response.status, envelope: await response.json() as { data?: { object: { id: string }; projectStructuralVersion: number; idempotent?: boolean }; error?: { code: string } } }; };
      const a = await post(`/api/v2/projects/${id}/causality/story-changes`, { expectedStructuralVersion: 1, kind: "EVENT", title: "A", isPlaceholder: false }); const b = await post(`/api/v2/projects/${id}/causality/story-changes`, { expectedStructuralVersion: 2, kind: "OUTCOME", title: "B", isPlaceholder: false }); const source = { type: "STORY_CHANGE", id: a.envelope.data!.object.id }; const target = { type: "STORY_CHANGE", id: b.envelope.data!.object.id };
      const forward = await post(`/api/v2/projects/${id}/causality/relations`, { expectedStructuralVersion: 3, source, target, relationType: "REQUIRES", state: "ACTIVE", isHard: true }); const duplicate = await post(`/api/v2/projects/${id}/causality/relations`, { expectedStructuralVersion: 4, source, target, relationType: "REQUIRES", state: "ACTIVE", isHard: true }); const cycle = await post(`/api/v2/projects/${id}/causality/relations`, { expectedStructuralVersion: 4, source: target, target: source, relationType: "REQUIRES", state: "ACTIVE", isHard: true });
      const reserved = await Promise.all(["TIMELINE_EVENT", "ENTITY_STATE", "CAPTURE_DERIVED"].map((type) => post(`/api/v2/projects/${id}/causality/relations`, { expectedStructuralVersion: 4, source: { type, id: crypto.randomUUID() }, target, relationType: "CAUSES" })));
      return { forward, duplicate, cycle, reserved };
    }, projectId);
    expect(facts.forward.status).toBe(201); expect(facts.duplicate.envelope.data?.object.id).toBe(facts.forward.envelope.data?.object.id); expect(facts.duplicate.envelope.data?.idempotent).toBe(true); expect(facts.cycle).toMatchObject({ status: 409, envelope: { error: { code: "INTEGRITY_ERROR" } } }); expect(facts.reserved.map((item) => [item.status, item.envelope.error?.code])).toEqual([[503, "DEPENDENCY_UNAVAILABLE"], [503, "DEPENDENCY_UNAVAILABLE"], [503, "DEPENDENCY_UNAVAILABLE"]]);
  });

  test("composes from writing and restores the exact position without changing prose", async ({ page }) => {
    const emitted: string[] = []; page.on("console", (message) => emitted.push(message.text())); const { chapterId } = await createProject(page); await page.goto(`/app/chapters/${chapterId}`); const editor = page.getByRole("textbox", { name: "Chapter manuscript" }); const prose = `Private causal prose ${Date.now()}`; await editor.fill(prose); await expect(page.locator(".command-bar .save-status")).toHaveText("Saved", { timeout: 15_000 });
    await editor.click(); await page.keyboard.press("End"); const before = await page.evaluate(() => ({ scrollTop: Math.round(window.scrollY), selection: window.getSelection()?.anchorOffset ?? -1, blockId: window.getSelection()?.anchorNode?.parentElement?.closest("[data-block-id]")?.getAttribute("data-block-id") ?? null }));
    await page.getByRole("button", { name: "Add cause or consequence" }).click(); const dialog = page.getByRole("dialog", { name: "Connect this manuscript moment" }); await dialog.getByLabel("Story Change").fill("The knock begins"); const relationResponse = page.waitForResponse((response) => response.url().endsWith("/causality/relations") && response.status() === 201); await dialog.getByRole("button", { name: "Record relationship" }).click(); await relationResponse; await expect(dialog).toHaveCount(0); await expect(editor).toBeFocused(); await expect(editor).toHaveText(prose);
    const after = await page.evaluate(() => ({ scrollTop: Math.round(window.scrollY), selection: window.getSelection()?.anchorOffset ?? -1, blockId: window.getSelection()?.anchorNode?.parentElement?.closest("[data-block-id]")?.getAttribute("data-block-id") ?? null })); expect(after).toEqual(before);
    const stored = await page.evaluate(async (id) => (await (await fetch(`/api/v2/chapters/${id}/editor`)).json()).data.chapter, chapterId); expect(JSON.stringify(stored.document)).toContain(prose); expect(emitted.join("\n")).toContain("S6-UI-006"); expect(emitted.join("\n")).toContain("S6-UI-007");
  });

  test("has no serious accessibility violations in the causal list and local Architect graph", async ({ page }) => {
    const { projectId } = await createProject(page, false); await page.goto(`/app/projects/${projectId}/structure`); await page.getByLabel("Presentation mode").selectOption("ARCHITECT"); await page.getByRole("button", { name: "Causal", exact: true }).click(); await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") }); const violations = await page.evaluate(async () => (await (window as typeof window & { axe: { run(): Promise<{ violations: Array<{ impact: string | null }> }> } }).axe.run()).violations.filter((item) => item.impact === "critical" || item.impact === "serious")); expect(violations).toEqual([]); await page.screenshot({ path: "test-results/causality-desktop.png", fullPage: true });
  });
});

test("keeps the optional causal composer usable on mobile", async ({ page }, testInfo) => {
  test.setTimeout(90_000); test.skip(testInfo.project.name !== "mobile-chromium", "S6 mobile flow runs in mobile Chromium."); const { projectId } = await createProject(page, false); await page.goto(`/app/projects/${projectId}/structure`); await page.getByRole("button", { name: "Causal", exact: true }).click(); await expect(page.getByRole("heading", { name: "One-line Story Change" })).toBeVisible(); await page.screenshot({ path: "test-results/causality-mobile.png", fullPage: true });
});
