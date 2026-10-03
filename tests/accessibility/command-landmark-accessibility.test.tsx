import axe from "axe-core";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { ThemeProvider } from "@/components/theming/ThemeProvider";

vi.mock("next/navigation", () => ({ usePathname: () => "/app", useRouter: () => ({ push: vi.fn() }) }));

beforeEach(() => {
  document.documentElement.lang = "en";
  document.title = "Synthetic command landmark proof";
  localStorage.clear();
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: { theme: "light" } }), { status: 200 })));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });

function openShell() {
  render(<ThemeProvider>
    <header className="command-bar"><strong>Mythra</strong><CommandPalette /></header>
    <main><h1>Synthetic writing origin</h1><label>Origin<input defaultValue="Synthetic selection" /></label></main>
  </ThemeProvider>);
  const origin = screen.getByRole("textbox", { name: "Origin" }) as HTMLInputElement;
  origin.focus(); origin.setSelectionRange(2, 7, "backward");
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  return { origin, dialog: screen.getByRole("dialog", { name: "Command palette" }) };
}

describe("separate command-dialog semantic repair in actual shell nesting", () => {
  it("passes full Axe without duplicate landmarks and preserves heading, Close and exact return", async () => {
    const { origin, dialog } = openShell();
    const report = await axe.run(document);
    expect(report.violations).toEqual([]);
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(dialog.querySelector("header")).toHaveAttribute("role", "none");
    expect(within(dialog).getByRole("heading", { name: "Command palette", level: 2 })).toBeVisible();
    const close = within(dialog).getByRole("button", { name: "Close" });
    expect(close).toBeVisible(); fireEvent.click(close);
    await waitFor(() => expect(origin).toHaveFocus());
    expect([origin.selectionStart, origin.selectionEnd, origin.selectionDirection]).toEqual([2, 7, "backward"]);
  });

  it("reproduces the original duplicate-banner finding when only the semantic attribute is removed", async () => {
    const { dialog } = openShell();
    const header = dialog.querySelector("header")!;
    header.removeAttribute("role");
    try {
      const report = await axe.run(document);
      expect(report.violations.some((violation) => violation.id === "landmark-no-duplicate-banner")).toBe(true);
      expect(screen.getAllByRole("banner")).toHaveLength(2);
    } finally { header.setAttribute("role", "none"); }
  });
});
