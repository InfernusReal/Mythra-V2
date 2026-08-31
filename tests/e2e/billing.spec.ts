import path from "node:path";
import { expect, test } from "@playwright/test";

test.describe("Sub-gate 14 billing and quotas", () => {
  test.setTimeout(120_000);
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "chromium", "S14 commercial flow runs once in desktop Chromium."));

  test("shows complete Core access, dormant Intelligence and provider-safe fallback paths", async ({ page }) => {
    const emitted: string[] = [];
    page.on("console", (message) => emitted.push(message.text()));
    await page.goto("/sign-in");
    await page.getByRole("button", { name: "Continue to Mythra" }).click();
    await page.waitForURL(/\/app$/u);
    await page.goto("/app/settings/billing");
    await expect(page.getByRole("heading", { name: "Mythra Core" })).toBeVisible();
    await expect(page.getByText("$15/month")).toBeVisible();
    await expect(page.getByRole("button", { name: "Future only" })).toBeDisabled();
    await expect(page.getByText(/not available, active, or charged/u)).toBeVisible();
    await expect(page.getByRole("progressbar")).toHaveCount(7);
    await page.getByRole("button", { name: "Choose Core" }).click();
    await page.waitForURL(/fixtureCheckout=/u);
    await expect(page.getByRole("button", { name: "Manage billing and invoices" })).toBeEnabled();
    await expect(page.getByRole("link", { name: "Return to writing" })).toHaveAttribute("href", "/app");
    expect(emitted.join("\n")).toContain("S14-UI-001");
    expect(emitted.join("\n")).toContain("S14-UI-002");
    await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") });
    const violations = await page.evaluate(async () => (await (window as typeof window & { axe: { run(): Promise<{ violations: Array<{ impact: string | null }> }> } }).axe.run()).violations.filter((item) => item.impact === "critical" || item.impact === "serious"));
    expect(violations).toEqual([]);
    await page.screenshot({ path: "test-results/billing-core-desktop.png", fullPage: true });
  });
});
