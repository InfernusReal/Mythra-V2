import path from "node:path";
import { expect, test } from "@playwright/test";
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
