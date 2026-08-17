import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

async function createProjectWithChapters(page: Page, chapterCount: number) {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Continue to Mythra" }).click();
  await page.waitForURL(/\/app$/);
  return page.evaluate(async ({ count }) => {
    const projectResponse = await fetch("/api/v2/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: `Milestones ${Date.now()}` }) });
    const project = await projectResponse.json() as { data: { id: string } };
    const chapterIds: string[] = [];
    for (let index = 0; index < count; index += 1) {
      const response = await fetch(`/api/v2/projects/${project.data.id}/chapters`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: `Chapter ${index + 1}` }) });
      const chapter = await response.json() as { data: { chapter: { id: string } } };
      chapterIds.push(chapter.data.chapter.id);
    }
    return { projectId: project.data.id, chapterIds };
  }, { count: chapterCount });
}

test.describe("Sub-gate 5 Milestones", () => {
  test.setTimeout(90_000);
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "chromium", "S5 primary flow runs once in desktop Chromium."));

  test("keeps zero milestones optional and applies only a reviewed allocation", async ({ page }) => {
    const emitted: string[] = []; page.on("console", (message) => emitted.push(message.text()));
    const { projectId } = await createProjectWithChapters(page, 4);
    await page.goto(`/app/projects/${projectId}/structure`);
    await page.getByRole("button", { name: "Milestones", exact: true }).click();
    await expect(page.getByText("No milestones. Writing and chapter planning remain available.")).toBeVisible();
    await page.getByRole("spinbutton", { name: "Milestones" }).fill("2");
    await page.getByRole("spinbutton", { name: "Chapters" }).fill("4");
    await page.getByLabel("Advisory project words").fill("12000");
    await page.getByLabel("Cadence start").fill("2026-09-01");
    await page.getByLabel("Cadence days").fill("14");
    const previewed = page.waitForResponse((response) => response.url().endsWith("/milestones/scaffold/preview") && response.ok());
    await page.getByRole("button", { name: "Preview allocation" }).click(); await previewed;
    const dialog = page.getByRole("dialog", { name: "Review milestone allocation" });
    await expect(dialog).toContainText("Milestone 1: chapters 1–2 · 6000 words · 2026-09-01");
    const applied = page.waitForResponse((response) => response.url().endsWith("/milestones/scaffold/apply") && response.ok());
    await dialog.getByRole("button", { name: "Apply reviewed allocation" }).click(); await applied;
    await expect(page.getByText("Version 2. Planning remains optional.")).toBeVisible();
    await expect(page.locator(".milestone-range-list li")).toHaveCount(2);
    await page.getByRole("button", { name: "Preview moving last first" }).click();
    const reorderDialog = page.getByRole("dialog", { name: "Review milestone reorder" });
    await expect(reorderDialog).toContainText("stable identities remain attached");
    const reorderApplied = page.waitForResponse((response) => response.url().endsWith("/milestones/reorder/apply") && response.request().method() === "POST");
    await reorderDialog.getByRole("button", { name: "Apply milestone reorder" }).click();
    const reorderResponse = await reorderApplied;
    expect(reorderResponse.status(), await reorderResponse.text()).toBe(200);
    await expect(page.getByText("Version 3. Planning remains optional.")).toBeVisible({ timeout: 15_000 });
    expect(emitted.join("\n")).toContain("S5-UI-006"); expect(emitted.join("\n")).toContain("S5-UI-007"); expect(emitted.join("\n")).toContain("S5-UI-009"); expect(emitted.join("\n")).toContain("S5-UI-010");
  });

  test("supports many-to-many roles, milestone intent/zoom and exact hard-cycle rejection", async ({ page }) => {
    const { projectId, chapterIds } = await createProjectWithChapters(page, 2);
    const state = await page.evaluate(async ({ id, chapterId }) => {
      const write = async (url: string, body: unknown) => (await (await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).json()).data;
      const first = await write(`/api/v2/projects/${id}/milestones`, { expectedStructuralVersion: 1, sequenceIndex: 0, title: "Opening", targetChapterStart: 0, targetChapterEnd: 0 });
      const second = await write(`/api/v2/projects/${id}/milestones`, { expectedStructuralVersion: 2, sequenceIndex: 1, title: "Turn", targetChapterStart: 1, targetChapterEnd: 1 });
      const link = await write(`/api/v2/projects/${id}/milestones/links`, { expectedStructuralVersion: 3, chapterId, milestoneId: first.object.id, role: "DEVELOP", weight: 2 });
      await write(`/api/v2/projects/${id}/milestones/links`, { expectedStructuralVersion: 4, chapterId, milestoneId: second.object.id, role: "TURN", weight: 1 });
      const intent = await write(`/api/v2/projects/${id}/structure/intents`, { expectedStructuralVersion: 5, targetType: "MILESTONE", targetId: first.object.id, category: "TENSION", intentText: "Increase pressure" });
      return { firstId: first.object.id as string, secondId: second.object.id as string, version: intent.projectStructuralVersion as number, linkId: link.object.id as string };
    }, { id: projectId, chapterId: chapterIds[0]! });
    await page.goto(`/app/projects/${projectId}/structure`);
    await page.getByRole("button", { name: "Milestones", exact: true }).click();
    await expect(page.locator(".milestone-range-list li")).toHaveCount(2);
    await page.getByRole("button", { name: "Chapter matrix" }).click();
    await expect(page.getByText(/Opening: develop \(2\)/)).toBeVisible();
    await expect(page.getByText(/Turn: turn \(1\)/)).toBeVisible();
    await page.getByRole("button", { name: "Dependencies" }).click();
    await page.getByLabel("Source").selectOption(state.firstId); await page.getByLabel("Depends on").selectOption(state.secondId); await page.getByLabel("Hard requirement").check();
    const forward = page.waitForResponse((response) => response.url().endsWith("/milestones/dependencies") && response.status() === 201);
    await page.getByRole("button", { name: "Add dependency" }).click(); await forward;
    await expect(page.getByText("Version 7. Planning remains optional.")).toBeVisible();
    await page.getByLabel("Source").selectOption(state.secondId); await page.getByLabel("Depends on").selectOption(state.firstId); await page.getByLabel("Hard requirement").check();
    await page.getByRole("button", { name: "Add dependency" }).click();
    await expect(page.locator(".form-error")).toContainText("integrity constraints");
    await page.getByRole("button", { name: "Semantic Zoom" }).click();
    await page.getByLabel("Active chapter").selectOption(chapterIds[0]!);
    await expect(page.getByText("MILESTONE THREAD").first()).toBeVisible();
    await expect(page.getByText("MILESTONE THREAD")).toHaveCount(2);
  });

  test("is accessible in the desktop milestone matrix", async ({ page }) => {
    const { projectId } = await createProjectWithChapters(page, 1);
    await page.goto(`/app/projects/${projectId}/structure`); await page.getByRole("button", { name: "Milestones", exact: true }).click(); await page.getByRole("button", { name: "Chapter matrix" }).click();
    await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") });
    const violations = await page.evaluate(async () => (await (window as typeof window & { axe: { run(): Promise<{ violations: Array<{ impact: string | null }> }> } }).axe.run()).violations.filter((item) => item.impact === "critical" || item.impact === "serious"));
    expect(violations).toEqual([]);
    await page.screenshot({ path: "test-results/milestones-desktop.png", fullPage: true });
  });
});

test("keeps milestone range planning usable on mobile", async ({ page }, testInfo) => {
  test.setTimeout(90_000); test.skip(testInfo.project.name !== "mobile-chromium", "S5 mobile flow runs in mobile Chromium.");
  const { projectId } = await createProjectWithChapters(page, 1);
  await page.goto(`/app/projects/${projectId}/structure`); await page.getByRole("button", { name: "Milestones", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Milestone ranges" })).toBeVisible();
  await page.screenshot({ path: "test-results/milestones-mobile.png", fullPage: true });
});
