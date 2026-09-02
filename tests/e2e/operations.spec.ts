import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page): Promise<void> {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Continue to Mythra" }).click();
  await page.waitForURL(/\/app$/);
}

test.describe("Sub-gate 16 operations", () => {
  test.setTimeout(120_000);

  test("exposes secure health, rejects cross-origin unsafe requests, and keeps admin content-safe", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Operations proof runs once in desktop Chromium.");
    const live = await page.request.get("/api/v2/health/live"); expect(live.ok()).toBe(true); expect(live.headers()["cache-control"]).toContain("no-store");
    const ready = await page.request.get("/api/v2/health/ready"); expect(ready.ok()).toBe(true);
    const home = await page.request.get("/"); expect(home.headers()["x-content-type-options"]).toBe("nosniff"); expect(home.headers()["x-frame-options"]).toBe("DENY"); expect(home.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
    const forbidden = await page.request.post("/api/v2/projects", { headers: { origin: "https://attacker.example", "content-type": "application/json" }, data: { title: "must not be created" } }); expect(forbidden.status()).toBe(403);

    await signIn(page);
    const privateTitle = `PRIVATE-MANUSCRIPT-${Date.now()}`;
    await page.getByLabel("Project title").fill(privateTitle);
    await page.getByRole("button", { name: "Write first chapter" }).click();
    await page.getByRole("textbox", { name: "Chapter manuscript" }).fill(`${privateTitle} secret prose`);
    await expect(page.locator(".save-status")).toContainText("Saved", { timeout: 20_000 });
    await page.goto("/app/admin");
    await expect(page.getByRole("heading", { name: "Workspace operations" })).toBeVisible();
    await expect(page.getByText(privateTitle)).toHaveCount(0);
    await expect(page.getByText(`${privateTitle} secret prose`)).toHaveCount(0);
    await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") });
    const violations = await page.evaluate(async () => (await (window as typeof window & { axe: { run(): Promise<{ violations: Array<{ impact: string | null }> }> } }).axe.run()).violations.filter((item) => item.impact === "critical" || item.impact === "serious"));
    expect(violations).toEqual([]);
    await page.screenshot({ path: "test-results/s16-admin-content-safe.png", fullPage: true });
  });
});
