import { expect, type Page } from "@playwright/test";
import baseline from "../../docs/audits/phase-7x-foundation-baseline.json" with { type: "json" };

export type ResolvedShellTheme = "light" | "dark" | "cream";
export const fallbackBodyColors = Object.freeze({
  light: "rgb(250, 250, 249)", dark: "rgb(17, 18, 20)", cream: "rgb(245, 239, 227)",
});

/** Independent finite expectations; never infer the expected color from the tested stylesheet. */
export function expectedShellBackground(mode: ResolvedShellTheme, palette: string | null, accent: string | null): string {
  if (!["light", "dark", "cream"].includes(mode)) throw new Error("Unknown resolved shell theme");
  if (palette === null && accent === null) return fallbackBodyColors[mode];
  const surface = baseline.appearanceContract.palettes.find((item) => item.key === palette);
  const interaction = baseline.appearanceContract.accents.find((item) => item.key === accent);
  if (!surface || !interaction) throw new Error("Unknown or partial shell appearance contract");
  const hex = surface.modes[mode].background;
  return `rgb(${hex.slice(1).match(/../gu)!.map((channel) => parseInt(channel, 16)).join(", ")})`;
}

export async function expectCurrentShellBackground(page: Page, mode: ResolvedShellTheme): Promise<void> {
  await expect(page.locator("html")).toHaveAttribute("data-theme", mode);
  const appearance = await page.locator("html").evaluate((root) => ({
    palette: root.getAttribute("data-appearance-palette"), accent: root.getAttribute("data-appearance-accent"),
  }));
  await expect(page.locator("body")).toHaveCSS("background-color", expectedShellBackground(mode, appearance.palette, appearance.accent));
}
