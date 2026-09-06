import "fake-indexeddb/auto";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Editor } from "@tiptap/core";
import { QuickCaptureOverlay } from "@/components/capture/QuickCaptureOverlay";
import { CaptureInbox } from "@/components/capture/CaptureInbox";

const id = (n: number) => `80000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const item = (rawText = "Inbox thought") => ({ id: id(3), projectId: id(1), rawText, lifecycle: "UNPROCESSED" as const, route: "/app", chapterId: id(2), outlineId: null, blockId: null, selectionAnchor: null, selectionHead: null, entityContext: [], capturedAt: new Date().toISOString(), deferredUntil: null, version: 1, attachmentCount: 0, conversionCount: 0, attachments: [] });
const editor = (focus = vi.fn()) => ({ state: { selection: { from: 3, to: 7, $from: { parent: { attrs: { blockId: id(9) } } } } }, commands: { setTextSelection: vi.fn(), focus } }) as unknown as Editor;
const response = (data: unknown, status = 200) => new Response(JSON.stringify(status < 400 ? { data } : { error: data }), { status });

beforeEach(async () => {
  vi.restoreAllMocks();
  await new Promise<void>((resolve) => { const request = indexedDB.deleteDatabase("mythra-capture-queue"); request.onsuccess = () => resolve(); request.onerror = () => resolve(); request.onblocked = () => resolve(); });
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
});

describe("Capture UI", () => {
  it("keeps private URL query values out of shortcut telemetry without changing the route", () => {
    const original = window.location.href;
    const privateQuery = "s18-private-url-query-canary";
    const url = new URL(original); url.searchParams.set("query", privateQuery);
    window.history.replaceState(null, "", url);
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    try {
      render(<QuickCaptureOverlay editor={null} projectId={id(1)} />);
      fireEvent.keyDown(window, { code: "Space", ctrlKey: true, shiftKey: true });
      expect(screen.getByRole("dialog", { name: "Capture" })).toBeVisible();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('"step":"S8-UI-001"'));
      expect(JSON.stringify(vi.mocked(console.log).mock.calls)).not.toContain(privateQuery);
      expect(window.location.href).toBe(url.href);
      fireEvent.keyDown(window, { key: "Escape" });
    } finally { window.history.replaceState(null, "", original); }
  });
  it("does not triage while typing, composing, or using modified shortcuts", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch").mockImplementation(async () => response({ updated: 1 }));
    const { container } = render(<CaptureInbox projectId={id(1)} initialCaptures={[item()]} initialStructuralVersion={1} />);
    fireEvent.click(screen.getByRole("checkbox"));
    const input = screen.getByRole("textbox", { name: "Attach to chapter ID" });
    for (const key of ["f", "d", "x", "r"]) fireEvent.keyDown(input, { key });
    const inbox = container.querySelector(".capture-inbox")!;
    fireEvent.keyDown(inbox, { key: "x", isComposing: true });
    fireEvent.keyDown(inbox, { key: "x", keyCode: 229 });
    for (const modifier of ["ctrlKey", "metaKey", "altKey", "shiftKey"]) fireEvent.keyDown(inbox, { key: "x", [modifier]: true });
    await Promise.resolve();
    expect(fetcher).not.toHaveBeenCalled();
    expect(screen.getByText(/UNPROCESSED/)).toBeVisible();
    fireEvent.keyDown(screen.getByRole("checkbox"), { key: "f" });
    expect(await screen.findByText(/FILED/)).toBeVisible();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("opens globally, saves raw-first, and restores focus before optional conversion", async () => {
    const focus = vi.fn(); vi.spyOn(window, "scrollTo").mockImplementation(() => undefined); vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(response({ capture: { id: id(4) }, projectStructuralVersion: 1 })).mockResolvedValueOnce(response({ id: id(5) }));
    render(<QuickCaptureOverlay editor={editor(focus)} projectId={id(1)} chapterId={id(2)} />); fireEvent.keyDown(window, { code: "Space", ctrlKey: true, shiftKey: true }); fireEvent.change(screen.getByRole("textbox", { name: "Thought" }), { target: { value: "Raw private thought" } }); fireEvent.change(screen.getByRole("combobox", { name: "Optional quick target" }), { target: { value: "MILESTONE" } }); fireEvent.click(screen.getByRole("button", { name: "Save Capture" }));
    await waitFor(() => expect(focus).toHaveBeenCalled()); await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(2)); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("supports bulk filing and explicit conversion in the Inbox", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(response({ updated: 1 })).mockResolvedValueOnce(response({ projectStructuralVersion: 2 })); render(<CaptureInbox projectId={id(1)} initialCaptures={[item()]} initialStructuralVersion={1} />); fireEvent.click(screen.getByRole("checkbox")); fireEvent.click(screen.getByRole("button", { name: "File selected" })); expect(await screen.findByText(/FILED/)).toBeVisible(); fireEvent.click(screen.getByRole("button", { name: "Convert to Story Change" })); await waitFor(() => expect(screen.getByText(/1 conversion/)).toBeVisible());
  });

  it("covers row lifecycle, keyboard, attachment, detachment, and both explicit causal directions", async () => {
    const capture = { ...item("Branch thought"), attachmentCount: 1, attachments: [{ id: id(4), targetType: "CHAPTER" as const, targetId: id(2), targetBlockId: "" }] }; const fetcher = vi.spyOn(globalThis, "fetch"); for (let index = 0; index < 4; index += 1) fetcher.mockResolvedValueOnce(response({ updated: 1 })); fetcher.mockResolvedValueOnce(response({ attachmentId: id(5) })).mockResolvedValueOnce(response({ detached: true })).mockResolvedValueOnce(response({ projectStructuralVersion: 3 })).mockResolvedValueOnce(response({ projectStructuralVersion: 5 }));
    const { container } = render(<CaptureInbox projectId={id(1)} initialCaptures={[capture]} initialStructuralVersion={1} returnChapterId={id(2)} />); fireEvent.click(screen.getByRole("button", { name: "Defer" })); await screen.findByText(/DEFERRED/); fireEvent.click(screen.getByRole("button", { name: "Dismiss" })); await screen.findByText(/DISMISSED/); fireEvent.click(screen.getByRole("button", { name: "Restore" })); await screen.findByText(/UNPROCESSED/); fireEvent.click(screen.getByRole("checkbox")); fireEvent.keyDown(container.querySelector(".capture-inbox")!, { key: "f" }); await screen.findByText(/FILED/);
    fireEvent.change(screen.getByRole("textbox", { name: "Attach to chapter ID" }), { target: { value: id(6) } }); fireEvent.click(screen.getByRole("button", { name: "Attach" })); await waitFor(() => expect(screen.getByText(new RegExp(id(6)))).toBeVisible()); fireEvent.click(screen.getAllByRole("button", { name: "Detach" })[0]!); await waitFor(() => expect(screen.getByText(/1 attachment/)).toBeVisible());
    fireEvent.change(screen.getByRole("combobox", { name: "Endpoint type" }), { target: { value: "MILESTONE" } }); fireEvent.change(screen.getByRole("textbox", { name: "Endpoint ID" }), { target: { value: id(7) } }); fireEvent.click(screen.getByRole("button", { name: "Because of endpoint" })); await waitFor(() => expect(screen.getByText(/1 conversion/)).toBeVisible()); fireEvent.click(screen.getByRole("button", { name: "This causes endpoint" })); await waitFor(() => expect(screen.getByText(/2 conversion/)).toBeVisible()); const requests = fetcher.mock.calls.map((call) => String(call[1]?.body ?? "")); expect(requests.some((body) => body.includes("BECAUSE_OF"))).toBe(true); expect(requests.some((body) => body.includes("THIS_CAUSES"))).toBe(true);
  });

  it("returns immediately on blank input and preserves a raw acknowledgement when optional conversion fails", async () => {
    const focus = vi.fn(); vi.spyOn(window, "scrollTo").mockImplementation(() => undefined); const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(response({ capture: { id: id(4) }, projectStructuralVersion: 1 })).mockResolvedValueOnce(response({ message: "Target conflict" }, 409)); render(<QuickCaptureOverlay editor={editor(focus)} projectId={id(1)} chapterId={id(2)} />); fireEvent.keyDown(window, { code: "Space", metaKey: true, shiftKey: true }); fireEvent.click(screen.getByRole("button", { name: "Save Capture" })); expect(fetcher).not.toHaveBeenCalled(); fireEvent.change(screen.getByRole("textbox", { name: "Thought" }), { target: { value: "Raw survives target failure" } }); fireEvent.change(screen.getByRole("combobox", { name: "Optional quick target" }), { target: { value: "MILESTONE" } }); fireEvent.click(screen.getByRole("button", { name: "Save Capture" })); await waitFor(() => expect(screen.getByText(/optional quick target/)).toBeVisible()); fireEvent.keyDown(window, { key: "Escape" }); expect(focus).toHaveBeenCalled();
  });

  it("works from a project surface without inventing chapter or selection coordinates", async () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined); const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue(response({ capture: { id: id(4) }, projectStructuralVersion: 1 })); render(<><button>Project action</button><QuickCaptureOverlay editor={null} projectId={id(1)} /></>); screen.getByRole("button", { name: "Project action" }).focus(); fireEvent.keyDown(window, { code: "Space", ctrlKey: true, shiftKey: true }); fireEvent.change(screen.getByRole("textbox", { name: "Thought" }), { target: { value: "Project-level thought" } }); fireEvent.click(screen.getByRole("button", { name: "Save Capture" })); await waitFor(() => expect(fetcher).toHaveBeenCalled()); await waitFor(() => expect(screen.getByRole("button", { name: "Project action" })).toHaveFocus()); const body = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body)) as Record<string, unknown>; expect(body).not.toHaveProperty("chapterId"); expect(body).not.toHaveProperty("selectionAnchor"); expect(body).not.toHaveProperty("selectionHead");
  });

  it("degrades safely when a mounted writing surface has no IndexedDB implementation", () => {
    const database = globalThis.indexedDB;
    vi.stubGlobal("indexedDB", undefined);
    expect(() => render(<QuickCaptureOverlay editor={null} projectId={id(1)} />)).not.toThrow();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('\"step\":\"S8-UI-005\"'));
    vi.stubGlobal("indexedDB", database);
  });

  it("records available outline and entity context without emitting entity identity", async () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined); const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue(response({ capture: { id: id(4) }, projectStructuralVersion: 1 })); render(<QuickCaptureOverlay editor={null} projectId={id(1)} outlineId={id(6)} entityContext={[id(7)]} />); fireEvent.keyDown(window, { code: "Space", ctrlKey: true, shiftKey: true }); fireEvent.change(screen.getByRole("textbox", { name: "Thought" }), { target: { value: "Context-bound thought" } }); fireEvent.click(screen.getByRole("button", { name: "Save Capture" })); await waitFor(() => expect(fetcher).toHaveBeenCalled()); const body = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body)) as Record<string, unknown>; expect(body).toMatchObject({ outlineId: id(6), entityContext: [id(7)] }); expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining(id(7)));
  });
});
