import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { expectCurrentShellBackground, fallbackBodyColors, type ResolvedShellTheme } from "../fixtures/shell-appearance-contract";

test("retains exact historical fallback colors in an independent stylesheet document", async ({ page }) => {
  await page.setContent('<!doctype html><html lang="en"><head><title>Independent fallback proof</title></head><body><main><h1>Fallback stylesheet fixture</h1></main></body></html>');
  await page.addStyleTag({ path: path.resolve("app/globals.css") });
  for (const mode of ["light", "dark", "cream"] as const) {
    await page.locator("html").evaluate((root, value) => root.setAttribute("data-theme", value), mode);
    await expect(page.locator("body")).toHaveCSS("background-color", fallbackBodyColors[mode]);
  }
});

test("diagnoses exact Capture return without audit scripts, viewport cycling or full-page screenshots", async ({ page }, info) => {
  const traces: Array<Record<string, string | number | boolean>> = [];
  page.on("console", (message) => {
    try {
      const event = JSON.parse(message.text()) as Record<string, unknown>;
      if (event.step === "S7-FOCUS-001" || event.step === "S7-FOCUS-002") {
        traces.push(Object.fromEntries(Object.entries(event).filter(([key, value]) =>
          ["step", "event", "selectionAnchor", "selectionHead", "scrollY", "routeUnchanged"].includes(key)
          && ["string", "number", "boolean"].includes(typeof value))) as Record<string, string | number | boolean>);
      }
    } catch { /* Ignore unrelated diagnostics; do not retain prose, URLs or raw messages. */ }
  });
  await page.setViewportSize({ width: info.project.name === "chromium" ? 1440 : 412, height: 1000 });
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Continue to Mythra" }).click();
  await page.waitForURL(/\/app$/u);
  await page.getByLabel("Project title").fill(`Synthetic return diagnosis ${Date.now()}`);
  await page.getByRole("button", { name: "Write first chapter" }).click();
  await page.waitForURL(/\/app\/chapters\/[0-9a-f-]+$/u);
  const editor = page.getByRole("textbox", { name: "Chapter manuscript" });
  await editor.fill("Synthetic appearance baseline manuscript. ".repeat(24));
  await expect(page.locator(".command-bar .save-status")).toHaveText("Saved", { timeout: 30_000 });
  await editor.focus(); await page.keyboard.press("Control+End");
  const position = () => page.evaluate(() => ({ anchor: getSelection()?.anchorOffset, head: getSelection()?.focusOffset, scrollX: Math.round(scrollX), scrollY: Math.round(scrollY) }));
  const before = await position(); const prose = await editor.textContent();
  await page.keyboard.press("Control+Shift+Space");
  await expect(page.getByRole("dialog", { name: "Capture", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(editor).toBeFocused();
  try { await expect.poll(position).toEqual(before); }
  finally { await info.attach("capture-return-diagnostic.json", { body: JSON.stringify({ before, after: await position(), traces, documentUnchanged: await editor.textContent() === prose }), contentType: "application/json" }); }
});

test("checks the current authenticated shell without disabling an installed appearance layer", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.name));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Continue to Mythra" }).click();
  await page.waitForURL(/\/app$/u);
  const theme = page.locator(".command-bar .theme-menu select");
  for (const mode of ["light", "dark", "cream"] as const) {
    await theme.selectOption(mode, { force: true });
    await expectCurrentShellBackground(page, mode);
  }
  await page.emulateMedia({ colorScheme: "dark" });
  await theme.selectOption("system", { force: true });
  await expectCurrentShellBackground(page, "dark" satisfies ResolvedShellTheme);
  const previous = await page.locator("html").evaluate((root) => ({ palette: root.getAttribute("data-appearance-palette"), accent: root.getAttribute("data-appearance-accent") }));
  await page.keyboard.press("Control+K");
  const dialog = page.getByRole("dialog", { name: "Command palette" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("header")).toHaveAttribute("role", "none");
  await expect(dialog.getByRole("heading", { name: "Command palette", level: 2 })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close" })).toBeVisible();
  await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") });
  expect(await page.evaluate(async () => {
    const axe = (window as typeof window & { axe: { run(root: Document): Promise<{ violations: Array<{ id: string; impact: string | null }> }> } }).axe;
    return (await axe.run(document)).violations.map(({ id, impact }) => ({ id, impact }));
  })).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(await page.locator("html").evaluate((root) => ({ palette: root.getAttribute("data-appearance-palette"), accent: root.getAttribute("data-appearance-accent") }))).toEqual(previous);
  expect(errors).toEqual([]);
});

type CaretProbeWindow = typeof window & { __mythraScreenshotProbe?: { mutations: number; observer: MutationObserver } };

/** Observe transient style changes as well as final styles; restoration alone must not hide caret injection. */
async function startCaretProbe(page: Page) {
  await page.evaluate(() => {
    const state = { mutations: 0, observer: null as unknown as MutationObserver };
    state.observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.target instanceof Element && ((record.oldValue ?? "").includes("caret-color")
          || (record.target.getAttribute("style") ?? "").includes("caret-color"))) state.mutations++;
      }
    });
    state.observer.observe(document.documentElement, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ["style"] });
    (window as CaretProbeWindow).__mythraScreenshotProbe = state;
  });
}

async function finishCaretProbe(page: Page) {
  return page.evaluate(() => {
    const state = (window as CaretProbeWindow).__mythraScreenshotProbe;
    if (!state) throw new Error("Synthetic screenshot probe absent");
    state.observer.disconnect();
    delete (window as CaretProbeWindow).__mythraScreenshotProbe;
    return state.mutations;
  });
}

test("captures real hydrated Research without injecting transient caret styles or hiding browser errors", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.name));
  page.on("console", (message) => { if (message.type() === "error") errors.push("console.error"); });
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Continue to Mythra" }).click();
  await page.waitForURL(/\/app$/u);
  await page.getByLabel("Project title").fill(`Synthetic screenshot proof ${Date.now()}`);
  await page.getByRole("button", { name: "Write first chapter" }).click();
  await page.waitForURL(/\/app\/chapters\/[0-9a-f-]+$/u);
  const project = await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link").getAttribute("href");
  if (!project) throw new Error("Synthetic Research destination absent");
  const researchPath = `${project}/research`;
  const hydrated = page.waitForEvent("console", {
    predicate: (message) => page.url().endsWith(researchPath) && message.text().includes('"step":"S0-THEME-002"'),
  });
  await page.goto(researchPath);
  await expect(page.getByRole("heading", { name: "Notes and Research" })).toBeVisible();
  await hydrated;
  const inputs = page.locator(".chronicle-workspace input,.chronicle-workspace textarea,.chronicle-workspace select");
  const styles = () => inputs.evaluateAll((elements) => elements.map((element) => element.getAttribute("style")));
  const before = await styles();
  expect(before.length).toBeGreaterThan(0);
  await startCaretProbe(page);
  try {
    for (let index = 0; index < 3; index++) {
      await page.screenshot({ path: info.outputPath(`research-caret-unchanged-${index}.png`), fullPage: true, caret: "initial" });
      expect(await styles()).toEqual(before);
    }
  } finally { expect(await finishCaretProbe(page)).toBe(0); }
  expect(errors).toEqual([]);
});

test("the independent screenshot probe detects default caret injection even when final styles are restored", async ({ page }, info) => {
  await page.setContent('<!doctype html><html lang="en"><head><title>Synthetic caret counterfactual</title></head><body><main><h1>Caret counterfactual</h1><label>Input<input></label><label>Text<textarea></textarea></label></main></body></html>');
  const inputs = page.locator("input,textarea");
  // The default screenshot restores CSS declarations but can leave an empty style attribute behind.
  const before = await inputs.evaluateAll((elements) => elements.map((element) => (element as HTMLElement).style.cssText));
  await startCaretProbe(page);
  await page.screenshot({ path: info.outputPath("default-caret-counterfactual.png"), fullPage: true });
  expect(await finishCaretProbe(page)).toBeGreaterThan(0);
  expect(await inputs.evaluateAll((elements) => elements.map((element) => (element as HTMLElement).style.cssText))).toEqual(before);
});
