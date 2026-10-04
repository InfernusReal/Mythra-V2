import { expect, test, type Page, type TestInfo } from "@playwright/test";
import path from "node:path";
import designBaseline from "../../docs/audits/phase-7x-foundation-baseline.json" with { type: "json" };
import { assertCosmeticCss } from "../../scripts/verify-phase7x-appearance-scope";

async function fixture(page: Page) {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Continue to Mythra" }).click();
  await page.waitForURL(/\/app$/u);
  await page.getByLabel("Project title").fill(`Synthetic appearance baseline ${Date.now()}`);
  await page.getByRole("button", { name: "Write first chapter" }).click();
  await page.waitForURL(/\/app\/chapters\/[0-9a-f-]+$/u);
  const chapter = new URL(page.url()).pathname;
  const project = await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link").getAttribute("href");
  if (!project) throw new Error("Synthetic baseline project missing");
  return { project, chapter };
}

async function snapshot(page: Page, info: TestInfo, name: string, modal = false) {
  await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const observations = await page.evaluate(async ({ modal }) => {
    const axe = (window as typeof window & { axe: { run(root: Element): Promise<{ violations: Array<{ id: string; impact: string | null }> }> } }).axe;
    const root = modal ? document.querySelector('[role="dialog"][aria-modal="true"]') : document.documentElement;
    if (!root) throw new Error("Expected active modal missing");
    const violations = (await axe.run(root)).violations.map(({ id, impact }) => ({ id, impact }));
    const visible = (element: Element) => { const box = element.getBoundingClientRect(); const style = getComputedStyle(element); return box.width > 0 && box.height > 0 && style.visibility !== "hidden" && style.display !== "none"; };
    const bounds = (element: Element) => { const box = element.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height }; };
    const font = (element: Element) => { const style = getComputedStyle(element); return { family: style.fontFamily, size: style.fontSize, weight: style.fontWeight, spacing: style.letterSpacing }; };
    const controls = [...document.querySelectorAll("button,a,input,select,textarea,summary")].filter(visible).map((element) => ({
      tag: element.tagName, name: element.getAttribute("aria-label") ?? element.textContent?.trim() ?? "", href: element.getAttribute("href"), disabled: element.hasAttribute("disabled"), bounds: bounds(element),
      font: font(element), keycaps: [...element.querySelectorAll("kbd")].filter(visible).map(font),
    }));
    const regions = [".command-bar", ".app-rail", ".shell-main", ".context-reservation", ".editor-canvas", ".editor-layout"]
      .flatMap((selector) => [...document.querySelectorAll(selector)].filter(visible).map((element) => ({ selector, bounds: bounds(element) })));
    const manuscript = document.querySelector('[aria-label="Chapter manuscript"]');
    const style = manuscript ? getComputedStyle(manuscript) : null;
    return { controls, regions, violations, theme: document.documentElement.dataset.theme, direction: document.documentElement.dir,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      manuscriptMetrics: style ? { fontFamily: style.fontFamily, fontSize: style.fontSize, lineHeight: style.lineHeight, width: style.width } : null };
  }, { modal });
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true });
  await info.attach(`${name}.json`, { body: JSON.stringify(observations, null, 2), contentType: "application/json" });
  expect(observations.overflow).toBe(false);
  return observations;
}

test.describe("7X-0 actual-product baseline, no appearance activation", () => {
  test.setTimeout(360_000);

  test("records all route families and existing control order on both device classes", async ({ page }, info) => {
    const violations: Array<{ state: string; findings: unknown[] }> = [];
    const observe = async (name: string) => { const result = await snapshot(page, info, name); if (result.violations.length) violations.push({ state: name, findings: result.violations }); return result; };
    const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.name));
    await page.goto("/sign-in"); await observe("before-sign-in");
    const { project, chapter } = await fixture(page);
    await page.goto(`${project}/universe`);
    await page.getByRole("textbox", { name: "Name", exact: true }).fill("Synthetic baseline entity");
    await page.getByRole("button", { name: "Create entity", exact: true }).click();
    const entityLink = page.getByRole("link", { name: /Synthetic baseline entity/u }); await expect(entityLink).toBeVisible();
    const entity = await entityLink.getAttribute("href"); if (!entity) throw new Error("Synthetic entity route missing");
    const routes = [
      ["root-redirect", "/"], ["project-list", "/app"], ["project-home", project], ["manuscript", chapter],
      ["structure", `${project}/structure`], ["universe", `${project}/universe`], ["entity", entity],
      ["timeline", `${project}/timeline`], ["capture-inbox", `${project}/captures`], ["search", `${project}/search`],
      ["research-notes", `${project}/research`], ["suggestions", `${project}/suggestions`],
      ["settings", "/app/settings"], ["billing", "/app/settings/billing"], ["operations", "/app/admin"],
    ];
    for (const [name, url] of routes) {
      await page.goto(url!); await expect(page.locator(".shell-main")).toBeVisible();
      const theme = page.locator(".command-bar .theme-menu select");
      await theme.selectOption("dark", { force: true }); await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      const observed = await observe(`before-${name}-dark`);
      expect(observed.theme).toBe("dark");
      if (info.project.name === "chromium") {
        expect(observed.regions.find((region) => region.selector === ".command-bar")?.bounds.height).toBe(48);
        expect(observed.regions.find((region) => region.selector === ".app-rail")?.bounds.width).toBe(48);
      } else expect(observed.regions.find((region) => region.selector === ".app-rail")?.bounds.height).toBe(52);
      expect(await theme.locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value))).toEqual(["light", "dark", "cream", "system"]);
    }
    expect(errors).toEqual([]);
    expect(violations).toEqual([]);
  });

  test("captures base modes, responsive boundaries, command and Capture return without changing metrics", async ({ page }, info) => {
    const violations: Array<{ state: string; findings: unknown[] }> = [];
    const observe = async (name: string, modal = false) => { const result = await snapshot(page, info, name, modal); if (result.violations.length) violations.push({ state: name, findings: result.violations }); return result; };
    const { chapter } = await fixture(page);
    const editor = page.getByRole("textbox", { name: "Chapter manuscript" });
    await editor.fill("Synthetic appearance baseline manuscript. ".repeat(24));
    await expect(page.locator(".command-bar .save-status")).toHaveText("Saved", { timeout: 30_000 });
    const modes = ["light", "dark", "cream", "system"];
    for (const mode of modes) {
      await page.locator(".command-bar .theme-menu select").selectOption(mode, { force: true });
      await expect(page.locator("html")).toHaveAttribute("data-theme", mode === "system" ? "light" : mode);
      await observe(`before-manuscript-${mode}`);
    }
    for (const width of [1440, 1024, 720, 412, 320, 767, 768, 1279, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      await observe(`before-manuscript-width-${width}`);
    }
    await page.setViewportSize({ width: info.project.name === "chromium" ? 1440 : 412, height: 1000 });
    await editor.focus(); await page.keyboard.press("Control+End");
    const position = () => page.evaluate(() => ({ anchor: getSelection()?.anchorOffset, head: getSelection()?.focusOffset, scrollX: Math.round(scrollX), scrollY: Math.round(scrollY) }));
    const before = await position(); const prose = await editor.textContent();
    await page.keyboard.press("Control+K"); await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
    await observe("before-command-dialog", true);
    await page.keyboard.press("Escape"); await expect(editor).toBeFocused(); await expect.poll(position).toEqual(before);
    await page.keyboard.press("Control+Shift+Space"); await expect(page.getByRole("dialog", { name: "Capture", exact: true })).toBeVisible();
    await observe("before-capture-dialog", true);
    await page.keyboard.press("Escape"); await expect(editor).toBeFocused(); await expect.poll(position).toEqual(before);
    await expect(page).toHaveURL(new RegExp(`${chapter}$`, "u")); expect(await editor.textContent()).toBe(prose);
    expect(violations).toEqual([]);
  });

  test("compares five dark palette candidates on the real editor with no production stylesheet or geometry change", async ({ page }, info) => {
    await fixture(page);
    await page.setViewportSize({ width: info.project.name === "chromium" ? 1440 : 412, height: 1000 });
    await page.locator(".command-bar .theme-menu select").selectOption("dark", { force: true });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    if (info.project.name === "chromium") await expect(page.getByRole("heading", { name: "Relevant Now", exact: true })).toBeVisible();
    await snapshot(page, info, "comparison-initial-render-dark");
    const before = await snapshot(page, info, "comparison-original-dark");
    const untouched = await snapshot(page, info, "comparison-untokened-repeat-dark");
    expect(untouched.controls.map((control) => ({ name: control.name, bounds: control.bounds, font: control.font, keycaps: control.keycaps })))
      .toEqual(before.controls.map((control) => ({ name: control.name, bounds: control.bounds, font: control.font, keycaps: control.keycaps })));
    const recommendations = ["citron", "copper", "mint", "rose", "ice"];
    for (const [index, palette] of designBaseline.appearanceContract.palettes.entries()) {
      const tokens = palette.modes.dark;
      const accent = designBaseline.appearanceContract.accents.find((item) => item.key === recommendations[index])!.modes.dark;
      const css = `:root:root[data-theme="dark"] {
        --bg: ${tokens.background}; --surface: ${tokens.surface}; --surface-raised: ${tokens.raised}; --surface-soft: ${tokens.subdued};
        --text: ${tokens.text}; --text-muted: ${tokens.muted}; --border: ${tokens.border}; --border-strong: ${tokens.emphasizedBorder};
        --accent: ${accent.accent}; --accent-action: ${accent.action}; --accent-soft: color-mix(in srgb, ${accent.accent} 14%, ${tokens.surface});
        --focus: ${accent.accent}; --focus-halo: color-mix(in srgb, ${accent.accent} 22%, transparent);
        --selection: color-mix(in srgb, ${accent.accent} 24%, transparent);
      } .primary-action, .continue-writing { color: ${accent.onAction}; }`;
      assertCosmeticCss(css);
      const preview = await page.addStyleTag({ content: css });
      try {
        const after = await snapshot(page, info, `candidate-${palette.key}-${recommendations[index]}-dark`);
        expect(after.manuscriptMetrics).toEqual(before.manuscriptMetrics);
        expect(after.controls.map((control) => ({ tag: control.tag, name: control.name, href: control.href, disabled: control.disabled })))
          .toEqual(before.controls.map((control) => ({ tag: control.tag, name: control.name, href: control.href, disabled: control.disabled })));
        expect(after.regions.map((region) => region.selector)).toEqual(before.regions.map((region) => region.selector));
        for (const [controlIndex, control] of after.controls.entries()) {
          expect(control.font).toEqual(before.controls[controlIndex]!.font);
          expect(control.keycaps).toEqual(before.controls[controlIndex]!.keycaps);
          for (const field of ["x", "y", "width", "height"] as const) expect(Math.abs(control.bounds[field] - before.controls[controlIndex]!.bounds[field])).toBeLessThanOrEqual(2);
        }
        for (const [regionIndex, region] of after.regions.entries()) {
          expect(region.selector).toBe(before.regions[regionIndex]?.selector);
          for (const field of ["x", "y", "width", "height"] as const) expect(Math.abs(region.bounds[field] - before.regions[regionIndex]!.bounds[field])).toBeLessThanOrEqual(2);
        }
        expect(after.violations).toEqual([]);
      } finally { await preview.evaluate((element) => (element as HTMLStyleElement).remove()); }
    }
  });
});
