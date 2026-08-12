import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/shell/AppShell";
import { ThemeProvider } from "@/components/theming/ThemeProvider";

describe("AppShell", () => {
  it("renders the empty shell without story controls", () => {
    render(<ThemeProvider><AppShell><h1>Your writing space is ready</h1></AppShell></ThemeProvider>);
    expect(screen.getByRole("heading", { name: "Your writing space is ready" })).toBeVisible();
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
    expect(screen.queryByText("Create project")).not.toBeInTheDocument();
  });

  it("opens and closes the command palette with focus restoration", () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(<ThemeProvider><AppShell><p>Empty</p></AppShell></ThemeProvider>);
    const trigger = screen.getByRole("button", { name: /Commands/ });
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getByRole("dialog", { name: "Command palette" })).toBeVisible();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("supports pointer open, explicit close, backdrop close, and theme selection", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(<ThemeProvider><AppShell><p>Empty</p></AppShell></ThemeProvider>);
    fireEvent.click(screen.getByRole("button", { name: /Commands/ }));
    fireEvent.change(screen.getAllByRole("combobox", { name: "Theme" })[0]!, { target: { value: "dark" } });
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("S0-THEME-001"));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Commands/ }));
    fireEvent.mouseDown(screen.getByRole("presentation"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
