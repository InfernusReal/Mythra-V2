import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TimelineWorkspace } from "@/components/timeline/TimelineWorkspace";
import { ResearchWorkspace } from "@/components/research/ResearchWorkspace";
import { DegradedNetworkStatus } from "@/components/shell/DegradedNetworkStatus";

const id = (n: number) => `a0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const event = { id: id(1), title: "Founding", description: null, mode: "ORDINAL" as const, displayLabel: "First remembered", calendarKey: null, sortStart: null, sortEnd: null, relativeToEventId: null, relativeOffset: null, ordinalValue: 1, version: 1, updatedAt: new Date().toISOString(), links: [] };
const note = { id: id(4), title: "Lore note", body: "Private", tags: ["lore"], sourceCaptureId: null, version: 1, updatedAt: new Date().toISOString(), backlinkCount: 2 };

afterEach(() => { vi.restoreAllMocks(); Object.defineProperty(navigator, "onLine", { configurable: true, value: true }); });

describe("Timeline and Research UI", () => {
  it("creates all-mode timeline events and explicit links without presenting causality", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const created = { ...event, id: id(2), mode: "RANGE" as const, title: "Siege", displayLabel: "The long winter", sortStart: 2, sortEnd: 9, ordinalValue: null };
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ data: { event: created, projectStructuralVersion: 8 } }) }).mockResolvedValueOnce({ ok: true, json: async () => ({ data: { linkId: id(3), replayed: false } }) });
    vi.stubGlobal("fetch", fetchMock); render(<TimelineWorkspace projectId={id(9)} initialEvents={[event]} initialStructuralVersion={7} />);
    await userEvent.selectOptions(screen.getByLabelText("Mode"), "RANGE"); await userEvent.clear(screen.getByLabelText("Title")); await userEvent.type(screen.getByLabelText("Title"), "Siege"); await userEvent.type(screen.getByLabelText("Display label"), "The long winter"); await userEvent.clear(screen.getByLabelText("Sortable start")); await userEvent.type(screen.getByLabelText("Sortable start"), "2"); await userEvent.clear(screen.getByLabelText("Sortable end")); await userEvent.type(screen.getByLabelText("Sortable end"), "9"); await userEvent.click(screen.getByRole("button", { name: "Add event" }));
    expect(await screen.findByText("Timeline event saved.")).toBeVisible(); expect(screen.getByText(/Structural version\s*8/u)).toBeVisible();
    await userEvent.selectOptions(screen.getByLabelText("Timeline event"), id(2)); await userEvent.selectOptions(screen.getByLabelText("Link target type"), "TIMELINE_EVENT"); await userEvent.selectOptions(screen.getByLabelText("Linked event"), id(1)); await userEvent.click(screen.getByRole("button", { name: "Link without causality" }));
    expect(await screen.findByText("Timeline link saved without creating causality.")).toBeVisible(); expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1] && (fetchMock.mock.calls[1]?.[1] as RequestInit).body))).toMatchObject({ targetType: "TIMELINE_EVENT", targetId: id(1) });
  });

  it("creates Notes/Research, promotes with provenance, and completes scanned private-file activation", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const item = { id: id(6), kind: "URL" as const, title: "Source", body: null, url: "https://example.test", citation: null, excerpt: null, asset: null, version: 1, updatedAt: new Date().toISOString() };
    const fileItem = { ...item, id: id(7), kind: "FILE" as const, url: null, asset: { id: id(8), displayName: "map.txt", contentType: "text/plain", sizeBytes: 3, scanStatus: "CLEAN" } };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { note: { ...note, id: id(5) } } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { item } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { targetId: id(10), targetType: "STORY_CHANGE", projectStructuralVersion: 8, replayed: false } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { assetId: id(8) } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { item: fileItem } }) });
    vi.stubGlobal("fetch", fetchMock); render(<ResearchWorkspace projectId={id(9)} initialNotes={[note]} initialItems={[]} initialStructuralVersion={7} />);
    const titleInputs = screen.getAllByLabelText("Title", { selector: "input" }); await userEvent.type(titleInputs[0]!, "New note"); await userEvent.click(screen.getByRole("button", { name: "Save note" })); expect(await screen.findByText("Durable note saved.")).toBeVisible();
    const researchTitles = screen.getAllByLabelText("Title", { selector: "input" }); await userEvent.selectOptions(screen.getByLabelText("Kind"), "URL"); await userEvent.type(researchTitles[1]!, "Source"); await userEvent.type(screen.getByLabelText("URL"), "https://example.test"); await userEvent.click(screen.getByRole("button", { name: "Add research" })); expect(await screen.findByText("Research item saved.")).toBeVisible();
    await userEvent.selectOptions(screen.getByLabelText("Note"), id(4)); await userEvent.click(screen.getByRole("button", { name: "Promote with provenance" })); expect(await screen.findByText(/source provenance retained/u)).toBeVisible();
    const input = screen.getByLabelText("Private file"); fireEvent.change(input, { target: { files: [new File(["map"], "map.txt", { type: "text/plain" })] } }); expect(await screen.findByText("Private file validated, scanned, and added to Research.")).toBeVisible(); expect(screen.getByRole("button", { name: "Download private file" })).toBeVisible();
  });

  it("plainly labels the complete degraded capability boundary", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined); Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    render(<DegradedNetworkStatus />); expect(await screen.findByRole("status")).toHaveTextContent("Search is limited to recently cached chapters"); expect(screen.getByRole("status")).toHaveTextContent("Structure changes, export, snapshots, and billing are unavailable");
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true }); fireEvent(window, new Event("online")); await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });

  it("reports each Timeline and Research transport failure without losing the current workspace", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const failure = (message: string) => ({ ok: false, json: async () => ({ error: { message } }) });
    const timelineFetch = vi.fn().mockResolvedValueOnce(failure("Timeline rejected.")).mockResolvedValueOnce(failure("Link rejected.")); vi.stubGlobal("fetch", timelineFetch);
    const timeline = render(<TimelineWorkspace projectId={id(9)} initialEvents={[event]} initialStructuralVersion={7} />);
    await userEvent.type(screen.getByLabelText("Title"), "Rejected event"); await userEvent.type(screen.getByLabelText("Display label"), "Rejected time"); await userEvent.type(screen.getByLabelText("Order"), "1");
    await userEvent.click(screen.getByRole("button", { name: "Add event" })); expect(await screen.findByText("Timeline rejected.")).toBeVisible();
    await userEvent.selectOptions(screen.getByLabelText("Timeline event"), id(1)); await userEvent.selectOptions(screen.getByLabelText("Link target type"), "CHAPTER"); await userEvent.type(screen.getByLabelText("Target ID"), id(8)); await userEvent.click(screen.getByRole("button", { name: "Link without causality" })); expect(await screen.findByText("Link rejected.")).toBeVisible(); timeline.unmount();

    const fileItem = { id: id(7), kind: "FILE" as const, title: "File", body: null, url: null, citation: null, excerpt: null, asset: { id: id(8), displayName: "map.txt", contentType: "text/plain", sizeBytes: 3, scanStatus: "CLEAN" }, version: 1, updatedAt: new Date().toISOString() };
    const researchFetch = vi.fn()
      .mockResolvedValueOnce(failure("Note rejected."))
      .mockResolvedValueOnce(failure("Research rejected."))
      .mockResolvedValueOnce(failure("Promotion rejected."))
      .mockResolvedValueOnce(failure("Upload rejected."))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { assetId: id(10) } }) })
      .mockResolvedValueOnce(failure("Activation rejected."))
      .mockResolvedValueOnce(failure("Access rejected."));
    vi.stubGlobal("fetch", researchFetch); render(<ResearchWorkspace projectId={id(9)} initialNotes={[note]} initialItems={[fileItem]} initialStructuralVersion={7} />);
    const titles = screen.getAllByLabelText("Title", { selector: "input" }); await userEvent.type(titles[0]!, "Note"); await userEvent.click(screen.getByRole("button", { name: "Save note" })); expect(await screen.findByText("Note rejected.")).toBeVisible();
    await userEvent.type(titles[1]!, "Research"); await userEvent.type(screen.getByLabelText("Research note"), "Body"); await userEvent.click(screen.getByRole("button", { name: "Add research" })); expect(await screen.findByText("Research rejected.")).toBeVisible();
    await userEvent.selectOptions(screen.getByLabelText("Note"), id(4)); await userEvent.click(screen.getByRole("button", { name: "Promote with provenance" })); expect(await screen.findByText("Promotion rejected.")).toBeVisible();
    const uploadInput = screen.getByLabelText("Private file"); fireEvent.change(uploadInput, { target: { files: [new File(["one"], "one.txt", { type: "text/plain" })] } }); expect(await screen.findByText("Upload rejected.")).toBeVisible();
    fireEvent.change(uploadInput, { target: { files: [new File(["two"], "two.txt", { type: "text/plain" })] } }); expect(await screen.findByText("Activation rejected.")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Download private file" })); expect(await screen.findByText("Access rejected.")).toBeVisible(); expect(screen.getByRole("heading", { name: "Notes and Research" })).toBeVisible();
  });
});
