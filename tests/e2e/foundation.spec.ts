import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page): Promise<void> {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Continue to Mythra" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: "Your writing space is ready" })).toBeVisible();
}

test.describe("Sub-gate 0 authenticated shell", () => {
  test("authenticates into an empty Light and Dark shell with exact desktop geometry", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Desktop geometry is verified in the desktop project.");
    const browserErrors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
    await signIn(page);
    await expect(page.getByText("Create project")).toHaveCount(0);

    const commandBar = await page.locator(".command-bar").boundingBox();
    const rail = await page.locator(".app-rail").boundingBox();
    expect(commandBar?.height).toBe(48);
    expect(rail?.width).toBe(48);

    await page.getByRole("combobox", { name: "Theme" }).selectOption("dark");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(17, 18, 20)");
    await page.screenshot({ path: "test-results/foundation-dark.png", fullPage: true });
    await page.getByRole("combobox", { name: "Theme" }).selectOption("light");
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(250, 250, 249)");
    await page.screenshot({ path: "test-results/foundation-light.png", fullPage: true });
    expect(browserErrors).toEqual([]);
  });

  test("supports keyboard palette, Escape focus restoration, and automated accessibility", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: /Commands/ }).focus();
    await page.keyboard.press("Control+K");
    await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Commands/ })).toBeFocused();

    await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") });
    const violations = await page.evaluate(async () => {
      const axe = (window as typeof window & {
        axe: { run(): Promise<{ violations: Array<{ id: string; impact: string | null }> }> }
      }).axe;
      return (await axe.run()).violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious");
    });
    expect(violations).toEqual([]);
  });

  test("uses a single-column mobile shell with bottom navigation", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "Mobile geometry is verified in the mobile project.");
    await signIn(page);
    const viewport = page.viewportSize();
    const rail = await page.locator(".app-rail").boundingBox();
    expect(viewport).not.toBeNull();
    expect(rail).not.toBeNull();
    expect(Math.round(rail!.y + rail!.height)).toBe(viewport!.height);
    await expect(page.getByRole("heading", { name: "Your writing space is ready" })).toBeVisible();
    await page.screenshot({ path: "test-results/foundation-mobile.png", fullPage: true });
  });
});
