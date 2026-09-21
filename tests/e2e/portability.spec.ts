import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

async function fixture(page: Page) {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Continue to Mythra" }).click();
  await page.waitForURL(/\/app$/u);
  return page.evaluate(async () => {
    const request = async <T>(url: string, body: unknown): Promise<T> => {
      const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const envelope = await response.json() as { data?: T; error?: { message: string } };
      if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? `${url} failed`);
      return envelope.data;
    };
    const project = await request<{ id: string }>("/api/v2/projects", { title: `Portability ${Date.now()}` });
    const chapter = await request<{ chapter: { id: string } }>(`/api/v2/projects/${project.id}/chapters`, { title: "Portable chapter" });
    return { projectId: project.id, chapterId: chapter.chapter.id };
  });
}

test.describe("Sub-gate 13 history and portability", () => {
  test.setTimeout(180_000);
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "chromium", "S13 primary flows run once in desktop Chromium."));

  test("verifies snapshot, export, safe-copy restore and explicit import confirmation", async ({ page }) => {
    const emitted: string[] = [];
    page.on("console", (message) => emitted.push(message.text()));
    const data = await fixture(page);
    await page.goto(`/app/projects/${data.projectId}`);
    await expect(page.getByRole("status").filter({ hasText: "Ready" })).toBeVisible();

    await page.getByRole("button", { name: "Create verified snapshot" }).click();
    await expect(page.getByText("Operation completed and verified.")).toBeVisible({ timeout: 30_000 });
    await page.getByText(/Verified snapshots \(\d+\)/u).click();
    await expect(page.getByText(/Structure v\d+ · Verified/u)).toBeVisible();

    await page.getByRole("button", { name: "Export full project archive" }).click();
    await page.getByText(/Export artifacts \(\d+\)/u).click();
    await expect(page.getByText(/Full project · Mythra JSON · Verified/u)).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: "Restore to safe copy" }).click();
    await expect(page.getByText("Operation completed and verified.")).toBeVisible({ timeout: 30_000 });

    await page.getByLabel("Preview import").setInputFiles({ name: "import.md", mimeType: "text/markdown", buffer: Buffer.from("# Imported chapter\n\nPreviewed manuscript body.") });
    await expect(page.getByText("No chapter changes until confirmation.")).toBeVisible();
    await expect(page.getByText("Previewed manuscript body.")).toBeVisible();
    await page.getByRole("button", { name: "Confirm chapter import" }).click();
    await expect(page.getByText("No chapter changes until confirmation.")).toBeHidden({ timeout: 30_000 });

    await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") });
    const violations = await page.evaluate(async () => (await (window as typeof window & { axe: { run(): Promise<{ violations: Array<{ impact: string | null }> }> } }).axe.run()).violations.filter((item) => item.impact === "critical" || item.impact === "serious"));
    expect(violations).toEqual([]);
    expect(emitted.join("\n")).toContain("S13-UI-001");
    expect(emitted.join("\n")).toContain("S13-UI-003");
    expect(emitted.join("\n")).toContain("S13-UI-006");
    await page.screenshot({ path: "test-results/portability-desktop.png", fullPage: true });
  });

  test("keeps writing available and disables portability while its dependency is unavailable", async ({ page, context }) => {
    const data = await fixture(page);
    await page.route(`**/api/v2/projects/${data.projectId}/portability`, (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "DEPENDENCY_UNAVAILABLE" } }) }));
    await page.goto(`/app/projects/${data.projectId}`);
    await expect(page.getByRole("status").filter({ hasText: "Unavailable; writing unaffected" })).toBeVisible();
    await page.goto(`/app/chapters/${data.chapterId}`);
    const editor = page.getByRole("textbox", { name: "Chapter manuscript" });
    await editor.fill("Writing remains available during portability failure.");
    await expect(editor).toContainText("Writing remains available");
    await page.goto(`/app/projects/${data.projectId}`);
    await context.setOffline(true);
    await expect(page.getByRole("status").filter({ hasText: "Unavailable offline" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create verified snapshot" })).toBeDisabled();
    await context.setOffline(false);
  });
});

test("keeps history controls usable on mobile Dark theme", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  test.skip(testInfo.project.name !== "mobile-chromium", "S13 mobile evidence runs in mobile Chromium.");
  const data = await fixture(page);
  await page.goto(`/app/projects/${data.projectId}`);
  await page.getByLabel("Theme").selectOption("dark", { force: true });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Create verified snapshot" })).toBeVisible();
  await page.screenshot({ path: "test-results/portability-mobile-dark.png", fullPage: true });
});
