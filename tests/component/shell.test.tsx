import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/shell/AppShell";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { ThemeProvider } from "@/components/theming/ThemeProvider";
import type { SearchReadModel } from "@/domains/search/domain/types";
import { SEARCH_EDITOR_RESULT } from "@/lib/search/editor-events";

const projectId = "b0000000-0000-4000-8000-000000000001";
const chapterId = "b0000000-0000-4000-8000-000000000002";
const commandModel: SearchReadModel = { projectId, projectStructuralVersion: 4, providerStates: [{ type: "CHAPTER", state: "ACTIVE" }], synchronized: { insertedOrUpdated: 1, removed: 0, sourceCount: 1, capped: false }, page: { returned: 1, limit: 40, nextCursor: null, total: 1 }, groups: [{ type: "CHAPTER", label: "Chapters", total: 1, hasMore: false, results: [{ id: projectId, documentType: "CHAPTER", sourceId: chapterId, sourceKey: `CHAPTER:${chapterId}`, blockId: null, title: "Command result", snippet: "Bounded result", sourceVersion: 1, sourceUpdatedAt: new Date().toISOString(), indexedAt: new Date().toISOString(), freshness: "CURRENT", rank: 10, matchReasons: ["exact"], explicitReference: false, currentContext: true, actions: [{ kind: "PEEK", label: "Peek" }], metadata: {} }] }] };

describe("AppShell", () => {
  it("renders the empty shell without story controls", () => {
    render(<ThemeProvider><AppShell><h1>Your writing space is ready</h1></AppShell></ThemeProvider>);
    expect(screen.getByRole("heading", { name: "Your writing space is ready" })).toBeVisible();
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
    expect(screen.queryByText("Create project")).not.toBeInTheDocument();
  });

  it("opens and closes the command palette with focus restoration", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(<ThemeProvider><AppShell><p>Empty</p></AppShell></ThemeProvider>);
    const trigger = screen.getByRole("button", { name: /Commands/ });
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getByRole("dialog", { name: "Command palette" })).toBeVisible();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
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

  it("searches project objects, traps focus, preserves Peek history and restores prior focus", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined); localStorage.setItem("mythra.search.recent.v1", JSON.stringify([{ sourceKey: `CHAPTER:${chapterId}`, usedAt: new Date().toISOString() }, { invalid: true }]));
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => String(input).includes("/preferences/theme")
      ? { ok: true, json: async () => ({ data: { theme: "system" } }) }
      : { ok: true, json: async () => ({ data: commandModel }) }); vi.stubGlobal("fetch", fetchMock);
    render(<ThemeProvider><button type="button">Writing origin</button><div data-search-project-id={projectId} data-search-chapter-id={chapterId} /><CommandPalette /></ThemeProvider>);
    const origin = screen.getByRole("button", { name: "Writing origin" }); origin.focus(); fireEvent.keyDown(window, { key: "k", ctrlKey: true }); const dialog = screen.getByRole("dialog", { name: "Command palette" }); expect(dialog).toBeVisible(); expect(screen.getByRole("link", { name: "Open full Search" })).toHaveAttribute("href", expect.stringContaining(chapterId));
    const input = screen.getByRole("textbox", { name: "Search commands and project objects" }); fireEvent.change(input, { target: { value: "Command" } }); expect(await screen.findByRole("heading", { name: "Chapters" })).toBeVisible(); fireEvent.keyDown(input, { key: "ArrowDown" }); expect(screen.getByRole("button", { name: "Peek" })).toHaveFocus();
    const historyLength = window.history.length; fireEvent.click(screen.getByRole("button", { name: "Peek" })); expect(screen.getByRole("dialog", { name: "Command result" })).toBeVisible(); expect(window.history.length).toBe(historyLength); fireEvent.keyDown(window, { key: "Escape" }); expect(screen.queryByRole("dialog", { name: "Command result" })).not.toBeInTheDocument(); expect(dialog).toBeVisible();
    window.dispatchEvent(new CustomEvent(SEARCH_EDITOR_RESULT, { detail: { action: "INSERT_REFERENCE", ok: true, message: "Reference complete.", projectStructuralVersion: 6 } })); expect((await screen.findAllByText("Reference complete.")).length).toBeGreaterThan(0);
    const close = screen.getByRole("button", { name: "Close" }); close.focus(); fireEvent.keyDown(window, { key: "Tab", shiftKey: true }); expect(document.activeElement).not.toBe(close); fireEvent.keyDown(window, { key: "Escape" }); await waitFor(() => expect(origin).toHaveFocus());
  });

  it("labels missing project context and degrades rejected or invalid search responses", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined); localStorage.setItem("mythra.search.recent.v1", "invalid-json"); vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { theme: "system" } }) }));
    const { rerender } = render(<ThemeProvider><CommandPalette /></ThemeProvider>); fireEvent.click(screen.getByRole("button", { name: /Commands/ })); expect(screen.getByRole("status")).toHaveTextContent("Open a project"); fireEvent.click(screen.getByRole("button", { name: "Close" }));
    const failedFetch = vi.fn(async (input: RequestInfo | URL) => String(input).includes("/preferences/theme") ? { ok: true, json: async () => ({ data: { theme: "system" } }) } : { ok: false, json: async () => ({ error: { message: "Search service unavailable." } }) }); vi.stubGlobal("fetch", failedFetch);
    rerender(<ThemeProvider><div data-search-project-id={projectId} /><CommandPalette /></ThemeProvider>); fireEvent.click(screen.getByRole("button", { name: /Commands/ })); fireEvent.change(screen.getByRole("textbox"), { target: { value: "Failure" } }); expect(await screen.findByText("Search service unavailable.")).toBeVisible(); fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } }); expect(screen.getByRole("status")).toHaveTextContent("Type to search");
  });
});
