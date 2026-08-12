import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

async function signIn(page: Page): Promise<void> {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Continue to Mythra" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

async function createProject(page: Page, title: string): Promise<{ projectId: string; projectUrl: string }> {
  await signIn(page);
  const projectId = await page.evaluate(async (projectTitle) => {
    const response = await fetch("/api/v2/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: projectTitle }) });
    const envelope = await response.json() as { data: { id: string } };
    return envelope.data.id;
  }, title);
  return { projectId, projectUrl: `/app/projects/${projectId}` };
}

async function createFirstChapter(page: Page, title: string) {
  await signIn(page);
  const created = await page.evaluate(async (projectTitle) => {
    const projectResponse = await fetch("/api/v2/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: projectTitle }) });
    const project = await projectResponse.json() as { data?: { id: string }; error?: { message: string } };
    if (!project.data) throw new Error(project.error?.message ?? "Project creation failed.");
    const chapterResponse = await fetch(`/api/v2/projects/${project.data.id}/chapters`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: "Chapter 1" }) });
    const chapter = await chapterResponse.json() as { data?: { chapter: { id: string } }; error?: { message: string } };
    if (!chapter.data) throw new Error(chapter.error?.message ?? "Chapter creation failed.");
    return { projectId: project.data.id, chapterId: chapter.data.chapter.id };
  }, title);
  const chapterUrl = `/app/chapters/${created.chapterId}`;
  const projectUrl = `/app/projects/${created.projectId}`;
  await page.goto(chapterUrl);
  await expect(page.getByRole("textbox", { name: "Chapter manuscript" })).toBeVisible();
  return { chapterUrl: new URL(chapterUrl, page.url()).toString(), projectUrl };
}

async function selectionFacts(page: Page) {
  return page.evaluate(() => {
    const selection = window.getSelection();
    const element = selection?.anchorNode instanceof Element ? selection.anchorNode : selection?.anchorNode?.parentElement;
    return { offset: selection?.anchorOffset ?? -1, blockId: element?.closest("[data-block-id]")?.getAttribute("data-block-id") ?? null, scrollTop: Math.round(window.scrollY) };
  });
}

test.describe("Sub-gate 4 Structure Core", () => {
  test.setTimeout(90_000);
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "chromium", "S4 primary flow runs once in desktop Chromium."));

  test("keeps zero structure optional and outside the writing path", async ({ page }) => {
    const privateText = `Private structure-free prose ${Date.now()}`;
    const { chapterUrl, projectUrl } = await createFirstChapter(page, `Structure-free ${Date.now()}`);
    const editor = page.getByRole("textbox", { name: "Chapter manuscript" });
    await editor.fill(privateText);
    await expect(page.locator(".command-bar .save-status")).toHaveText("Saved", { timeout: 15_000 });
    await page.goto(projectUrl);
    await expect(page.getByRole("link", { name: "Continue Writing" })).toHaveAttribute("href", new URL(chapterUrl).pathname);
    await expect(page.getByRole("link", { name: "Open Structure" })).toBeVisible();
    const overview = await page.evaluate(async (url) => (await fetch(`${url.replace("/app/", "/api/v2/")}/structure`)).json(), projectUrl) as { data: { plot: unknown; volumes: unknown[]; chapterOutlines: unknown[]; scenes: unknown[]; references: unknown[] } };
    expect(overview.data).toMatchObject({ plot: null, volumes: [], chapterOutlines: [], scenes: [], references: [] });
    await page.getByRole("link", { name: "Continue Writing" }).click();
    await expect(editor).toHaveText(privateText);
  });

  test("scaffolds and reorders only after reviewed previews", async ({ page }) => {
    const emitted: string[] = [];
    page.on("console", (message) => emitted.push(message.text()));
    const { projectUrl } = await createFirstChapter(page, `Planner ${Date.now()}`);
    await page.goto(`${projectUrl}/structure`);
    await expect(page.getByRole("heading", { name: "Bulk scaffold" })).toBeVisible();
    await page.getByLabel("Volumes").fill("3");
    await page.getByLabel("Chapter count").fill("12");
    const scaffoldPreviewed = page.waitForResponse((response) => response.url().endsWith("/structure/scaffold/preview") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Preview scaffold" }).click();
    expect((await scaffoldPreviewed).ok()).toBe(true);
    const dialog = page.getByRole("dialog", { name: "Scaffold preview" });
    await expect(dialog).toContainText("Volume 1: chapters 1–4", { timeout: 15_000 });
    await expect(dialog.getByRole("button", { name: "Apply reviewed scaffold" })).toBeEnabled();
    const scaffoldApplied = page.waitForResponse((response) => response.url().endsWith("/structure/scaffold/apply") && response.request().method() === "POST");
    await dialog.getByRole("button", { name: "Apply reviewed scaffold" }).click();
    expect((await scaffoldApplied).ok()).toBe(true);
    await expect(page.getByText("Version 2. Planning remains optional.")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Volumes" }).click();
    await expect(page.getByTestId("volumes-lens").locator(".volume-lane li")).toHaveCount(3);
    const reorderPreviewed = page.waitForResponse((response) => response.url().endsWith("/structure/reorder/preview") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Preview moving last first" }).click();
    expect((await reorderPreviewed).ok()).toBe(true);
    const reorder = page.getByRole("dialog", { name: "Renumber preview" });
    await expect(reorder).toContainText("References retain stable IDs", { timeout: 15_000 });
    const reorderApplied = page.waitForResponse((response) => response.url().endsWith("/structure/reorder/apply") && response.request().method() === "POST");
    await reorder.getByRole("button", { name: "Apply reorder" }).click();
    expect((await reorderApplied).ok()).toBe(true);
    await expect(page.getByText("Version 3. Planning remains optional.")).toBeVisible({ timeout: 15_000 });
    expect(emitted.join("\n")).toContain("S4-UI-003");
    expect(emitted.join("\n")).toContain("S4-UI-004");
    expect(emitted.join("\n")).toContain("S4-UI-005");
    expect(emitted.join("\n")).toContain("S4-UI-006");
  });

  test("restores the exact writing position after Structure navigation", async ({ page }) => {
    const emitted: string[] = [];
    page.on("console", (message) => emitted.push(message.text()));
    const privateText = `Private focus restoration ${Date.now()}`;
    const { chapterUrl } = await createFirstChapter(page, `Focus ${Date.now()}`);
    const editor = page.getByRole("textbox", { name: "Chapter manuscript" });
    await editor.fill(privateText);
    for (let index = 0; index < 30; index += 1) { await page.keyboard.press("Enter"); await page.keyboard.type(`Paragraph ${index}`); }
    await expect(page.locator(".command-bar .save-status")).toHaveText("Saved", { timeout: 15_000 });
    const target = page.locator(".editor-prose p").nth(20);
    await target.click(); await page.keyboard.press("End"); await page.keyboard.press("ArrowLeft"); await page.evaluate(() => window.scrollTo(0, 500));
    const saved = page.waitForResponse((response) => response.url().includes("/continuation") && response.request().method() === "PUT" && response.ok());
    await page.keyboard.press("ArrowLeft"); await saved;
    const before = await selectionFacts(page);
    await page.getByRole("link", { name: "Structure" }).click();
    await expect(page).toHaveURL(/\/structure$/);
    await page.getByRole("link", { name: "Return to writing" }).click();
    await expect(page).toHaveURL(chapterUrl);
    await expect.poll(() => emitted.filter((entry) => entry.includes("S3-CLIENT-002")).length, { timeout: 10_000 }).toBeGreaterThan(0);
    await expect.poll(async () => (await selectionFacts(page)).blockId, { timeout: 10_000 }).toBe(before.blockId);
    const after = await selectionFacts(page);
    expect(after.blockId).toBe(before.blockId);
    expect(after.offset).toBe(before.offset);
    expect(Math.abs(after.scrollTop - before.scrollTop)).toBeLessThanOrEqual(2);
  });

  test("renders the active-lens shell accessibly and excludes future lenses", async ({ page }) => {
    const { projectUrl } = await createProject(page, `Accessible structure ${Date.now()}`);
    await page.goto(`${projectUrl}/structure`);
    const lensNav = page.getByRole("navigation", { name: "Structure lenses" });
    await expect(lensNav.getByRole("button", { name: "Outline", exact: true })).toBeVisible();
    await expect(lensNav.getByRole("button", { name: "Milestones", exact: true })).toHaveCount(0);
    await expect(lensNav.getByRole("button", { name: "Causal", exact: true })).toHaveCount(0);
    await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") });
    const violations = await page.evaluate(async () => {
      const axe = (window as typeof window & { axe: { run(): Promise<{ violations: Array<{ impact: string | null }> }> } }).axe;
      return (await axe.run()).violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious");
    });
    expect(violations).toEqual([]);
    await page.screenshot({ path: "test-results/structure-core-desktop.png", fullPage: true });
  });
});

test("keeps Structure usable in mobile Dark mode", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobile S4 layout runs in the mobile project.");
  const { projectUrl } = await createProject(page, `Mobile structure ${Date.now()}`);
  await page.goto(`${projectUrl}/structure`);
  await page.locator('select[aria-label="Theme"]').selectOption("dark", { force: true });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("navigation", { name: "Structure lenses" })).toBeVisible();
  await page.getByRole("navigation", { name: "Structure lenses" }).getByRole("button", { name: "Semantic Zoom", exact: true }).click();
  await expect(page.getByTestId("semantic-zoom-lens")).toBeVisible();
  await page.screenshot({ path: "test-results/structure-core-mobile-dark.png", fullPage: true });
});
