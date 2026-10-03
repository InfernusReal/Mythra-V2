import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { ThemeProvider } from "@/components/theming/ThemeProvider";
import { installEarlyCommandIntent } from "@/lib/commands/early-intent";

const project = "b0000000-0000-4000-8000-000000000001";
const chapter = "b0000000-0000-4000-8000-000000000002";
const route = vi.hoisted(() => ({ pathname: "" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ data: { theme: "light" } }) })));
  route.pathname = `/app/projects/${project}/structure`;
  window.history.replaceState(null, "", `${route.pathname}?returnChapterId=${chapter}`);
  const state = installEarlyCommandIntent(window); state.ready = false; state.pendingAt = null; state.pendingRoute = null;
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });

describe("early shortcut to existing palette handoff", () => {
  it("opens the unchanged return command exactly once when hydration claims an early request", async () => {
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    render(<ThemeProvider><CommandPalette /></ThemeProvider>);
    const dialog = await screen.findByRole("dialog", { name: "Command palette" });
    expect(within(dialog).getByRole("link", { name: /^Continue Writing$/u })).toHaveAttribute("href", `/app/chapters/${chapter}`);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(localStorage.getItem("mythra.commands.recent.v2")).toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    act(() => { fireEvent.keyDown(window, { key: "k", ctrlKey: true }); });
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });
  it("does not replay a queued request over an existing modal", () => {
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    render(<ThemeProvider><section role="dialog" aria-modal="true" aria-label="Existing modal" /><CommandPalette /></ThemeProvider>);
    expect(screen.queryByRole("dialog", { name: "Command palette" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Existing modal" })).toBeInTheDocument();
  });
});
