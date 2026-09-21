import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page): Promise<void> {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Continue to Mythra" }).click();
  await page.waitForURL(/\/app$/);
}

async function createEditor(page: Page): Promise<void> {
  await signIn(page);
  await page.getByLabel("Project title").fill(`S15 responsive ${Date.now()}`);
  await page.getByRole("button", { name: "Write first chapter" }).click();
  await expect(page.getByRole("textbox", { name: "Chapter manuscript" })).toBeVisible({ timeout: 20_000 });
}

test.describe("Sub-gate 15 production writing surfaces", () => {
  test.setTimeout(120_000);

  test("keeps mobile writing, Capture, Search, Context, Entity, Outline, navigation, IME, Cream, reflow, and accessibility reachable", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "Mobile capability is verified in the mobile project.");
    const emitted: string[] = [];
    page.on("console", (message) => emitted.push(message.text()));
    await createEditor(page);
    const editor = page.getByRole("textbox", { name: "Chapter manuscript" });

    await page.route("**/api/v2/chapters/**", async (route) => {
      if (route.request().method() === "PUT") await new Promise((resolve) => setTimeout(resolve, 1_500));
      await route.continue();
    });
    await editor.fill("Network-independent local input");
    await expect(editor).toContainText("Network-independent local input");
    await editor.evaluate((element) => element.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true })));
    await page.keyboard.insertText("日本語输入 العربية");
    await editor.evaluate((element) => element.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "日本語输入 العربية" })));
    await expect(editor).toContainText("日本語输入 العربية");

    const captureDurations = await page.evaluate(async () => {
      const samples: number[] = [];
      for (let index = 0; index < 12; index += 1) {
        const started = performance.now();
        window.dispatchEvent(new CustomEvent("mythra:mobile-writing-action", { detail: "capture" }));
        while (!document.querySelector(".capture-overlay textarea")) await new Promise(requestAnimationFrame);
        samples.push(performance.now() - started);
        (document.querySelector(".capture-overlay button[type=button]") as HTMLButtonElement).click();
        await new Promise(requestAnimationFrame);
      }
      return samples;
    });
    const p95Capture = [...captureDurations].sort((left, right) => left - right)[Math.ceil((captureDurations.length - 1) * .95)]!;
    // Console trace S15-PERF-001: browser profiling records only the capture sample count and measured p95 duration.
    console.log(JSON.stringify({ level: "info", step: "S15-PERF-001", event: "performance.capture_profile_completed", sampleCount: captureDurations.length, p95Ms: p95Capture }));
    expect(p95Capture).toBeLessThan(100);

    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Context" }).click();
    await expect(page.locator(".context-mobile")).toBeVisible();
    await page.locator(".context-mobile").getByRole("button", { name: "Return to Chapter" }).click();

    await editor.focus();
    await page.keyboard.press("Control+A");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.up("Shift");
    await page.getByRole("button", { name: "Entity", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Create entity" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    const languageCard = page.getByLabel("Language");
    if (await languageCard.count()) await languageCard.getByRole("button", { name: "Dismiss" }).click();

    await expect(page.getByRole("link", { name: "Outline" })).toHaveAttribute("href", /\/structure/);
    await page.getByRole("button", { name: "Navigation" }).click();
    await expect(page.getByRole("dialog", { name: "Navigation" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Navigation" })).toBeFocused();

    await page.locator('select[aria-label="Theme"]').selectOption("cream", { force: true });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "cream");
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") });
    const violations = await page.evaluate(async () => (await (window as typeof window & { axe: { run(): Promise<{ violations: Array<{ impact: string | null }> }> } }).axe.run()).violations.filter((item) => item.impact === "critical" || item.impact === "serious"));
    expect(violations).toEqual([]);
    await page.screenshot({ path: "test-results/s15-mobile-cream-200-percent.png", fullPage: true });
    const output = emitted.join("\n");
    for (const step of ["S15-MOBILE-001", "S15-MOBILE-002", "S15-MOBILE-004", "S15-MOBILE-005", "S15-MOBILE-006", "S15-MOBILE-007", "S15-THEME-001"]) expect(output).toContain(step);
    expect(output).not.toContain("Network-independent local input");
    expect(output).not.toContain("日本語输入 العربية");
  });

  test("preserves wide and compact Context geometry and causal list equivalence", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Wide and compact geometry are verified in desktop Chromium.");
    await createEditor(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator("#context-field-slot")).toBeVisible();
    const before = await page.getByRole("textbox", { name: "Chapter manuscript" }).boundingBox();
    await page.waitForTimeout(500);
    const after = await page.getByRole("textbox", { name: "Chapter manuscript" }).boundingBox();
    expect(after).toEqual(before);
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.locator("#context-field-slot")).toBeHidden();
    await expect(page.getByRole("button", { name: "Relevant Now" })).toBeVisible();
    await page.goto((await page.getByRole("link", { name: "Structure" }).getAttribute("href"))!);
    const localGraph = page.getByRole("heading", { name: "Local graph" });
    if (await localGraph.count()) {
      await expect(localGraph.locator("xpath=following::p[1]")).toContainText("accessible equivalent");
      await expect(page.getByRole("heading", { name: "Causal relationships" })).toBeVisible();
    }
    await page.screenshot({ path: "test-results/s15-compact-light.png", fullPage: true });
  });

  test("selects Arabic RTL long-label resources with English fallback remaining explicit", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Locale document metadata is verified once.");
    await page.setExtraHTTPHeaders({ "x-mythra-locale": "ar-PK" });
    await page.goto("/sign-in");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("button", { name: "المتابعة إلى ميثرا" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.screenshot({ path: "test-results/s15-arabic-rtl.png", fullPage: true });
    await page.getByRole("button", { name: "المتابعة إلى ميثرا" }).click();
    await page.waitForURL(/\/app$/);
    await expect(page.getByLabel("Project title")).toBeVisible();
    await page.locator(".command-trigger").click();
    const palette = page.getByRole("dialog", {
      name: "لوحة الأوامر والبحث في المشروع",
    });
    await expect(palette).toBeVisible();
    await expect(palette.getByRole("button", { name: "Create project" })).toBeVisible();
    await page.screenshot({
      path: "test-results/s18-i18n-product-arabic-fallback.png",
      fullPage: true,
    });
  });
});
