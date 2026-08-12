import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page): Promise<void> {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Continue to Mythra" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

async function createFirstChapter(page: Page, title: string): Promise<void> {
  await page.getByLabel("Project title").fill(title);
  await page.getByRole("button", { name: "Write first chapter" }).click();
  await expect(page).toHaveURL(/\/app\/chapters\/[0-9a-f-]+$/, { timeout: 20_000 });
  await expect(page.getByRole("textbox", { name: "Chapter manuscript" })).toBeVisible({ timeout: 10_000 });
}

test.describe("Sub-gate 1 project, chapter, and editor core", () => {
  test("moves from title to first keystroke without structure and preserves Unicode local state", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Desktop writing flow is verified in the desktop project.");
    const emitted: string[] = [];
    page.on("console", (message) => emitted.push(message.text()));
    await signIn(page);
    const projectTitle = `Editor flow ${Date.now()}`;
    await createFirstChapter(page, projectTitle);

    const editor = page.getByRole("textbox", { name: "Chapter manuscript" });
    const prose = "First words \u2014 \u4e16\u754c \u0645\u0631\u062d\u0628\u0627";
    await editor.fill(prose);
    await expect(editor).toContainText(prose);
    await expect(page.getByText("5 words")).toBeVisible();
    await expect(page.locator(".editor-status")).toContainText("Autosave on");
    await expect(page.getByText("No target")).toBeVisible();
    await expect(page.locator(".command-bar .save-status")).toHaveText(/Saved|Saving/);

    await page.waitForTimeout(600);
    await page.getByRole("button", { name: "Bold" }).click();
    await page.keyboard.type("bold");
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(editor).not.toContainText("bold");
    await expect(editor).toContainText(prose);

    await page.keyboard.press("Control+Shift+F");
    await expect(page.locator(".editor-layout")).toHaveClass(/focus-mode/);
    await page.keyboard.press("Escape");
    await expect(page.locator(".editor-layout")).not.toHaveClass(/focus-mode/);
    await expect(editor).toBeFocused();

    await page.keyboard.press("Control+K");
    await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(editor).toBeFocused();

    await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") });
    const violations = await page.evaluate(async () => {
      const axe = (window as typeof window & { axe: { run(): Promise<{ violations: Array<{ id: string; impact: string | null }> }> } }).axe;
      return (await axe.run()).violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious");
    });
    expect(violations).toEqual([]);

    const combinedConsole = emitted.join("\n");
    expect(combinedConsole).toContain("S1-FLOW-001");
    expect(combinedConsole).toContain("S1-EDITOR-CLIENT-002");
    expect(combinedConsole).not.toContain(projectTitle);
    expect(combinedConsole).not.toContain(prose);
    await page.screenshot({ path: "test-results/editor-core-light.png", fullPage: true });
  });

  test("renders the one-chapter editor in Dark theme on mobile", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "Mobile editor is verified in the mobile project.");
    await signIn(page);
    await createFirstChapter(page, `Mobile editor ${Date.now()}`);
    await page.locator('select[aria-label="Theme"]').selectOption("dark", { force: true });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("textbox", { name: "Chapter manuscript" }).fill("Mobile draft");
    await expect(page.getByRole("textbox", { name: "Chapter manuscript" })).toContainText("Mobile draft");
    await page.screenshot({ path: "test-results/editor-core-mobile.png", fullPage: true });
  });

  test("accepts an IME composition lifecycle and durably restores the composed text", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "The baseline IME lifecycle is verified in the desktop project.");
    await signIn(page);
    await createFirstChapter(page, `IME baseline ${Date.now()}`);
    const editor = page.getByRole("textbox", { name: "Chapter manuscript" });
    await editor.focus();
    await editor.evaluate((element) => element.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, data: "" })));
    await page.keyboard.insertText("日本語入力");
    await editor.evaluate((element) => element.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "日本語入力" })));
    await expect(editor).toContainText("日本語入力");
    await expect(page.locator(".command-bar .save-status")).toHaveText("Saved", { timeout: 10_000 });
    await page.reload();
    await expect(page.getByRole("textbox", { name: "Chapter manuscript" })).toContainText("日本語入力");
  });

  test("returns a stable unauthenticated envelope for editor APIs", async ({ request }) => {
    const response = await request.post("/api/v2/projects", { data: { title: "Denied" } });
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "UNAUTHENTICATED" } });
  });
});
