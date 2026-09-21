import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PortabilityPanel } from "@/components/portability/PortabilityPanel";

afterEach(() => vi.restoreAllMocks());

describe("PortabilityPanel interactions", () => {
  it("runs snapshot/export/import/restore controls while keeping preview confirmation explicit", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/portability")) return { ok: true, json: async () => ({ data: { snapshots: [{ id: "10000000-0000-4000-a000-000000000001", status: "VERIFIED", structuralVersion: 4, sizeBytes: "500", requestedAt: "2026-08-30T00:00:00.000Z", verifiedAt: "2026-08-30T00:00:01.000Z", retentionUntil: "2026-11-30T00:00:00.000Z" }], artifacts: [], imports: [] } }) };
      if (url.includes("/imports/preview")) return { ok: true, json: async () => ({ data: { importId: "20000000-0000-4000-a000-000000000001", preview: { chapters: [{ title: "Imported", bodyText: "Preview only", wordCount: 2 }], warningCodes: [] } } }) };
      if (url.includes("/exports")) return { ok: true, json: async () => ({ data: { artifactId: "30000000-0000-4000-a000-000000000001" } }) };
      if (url.includes("/restore")) return { ok: true, json: async () => ({ data: { projectId: "40000000-0000-4000-a000-000000000001" } }) };
      if (url.includes("/imports/")) return { ok: true, json: async () => ({ data: { chapterIds: ["50000000-0000-4000-a000-000000000001"] } }) };
      return { ok: true, json: async () => ({ data: { snapshotId: "60000000-0000-4000-a000-000000000001" } }) };
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<PortabilityPanel projectId="00000000-0000-4000-a000-000000000001" />);
    await screen.findByText("Ready");

    fireEvent.click(screen.getByRole("button", { name: "Create verified snapshot" })); await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/snapshots"))).toBe(true));
    fireEvent.click(screen.getByRole("button", { name: "Export manuscript" })); await waitFor(() => expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("/exports")).length).toBe(1));
    fireEvent.click(screen.getByRole("button", { name: "Export full project archive" })); await waitFor(() => expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("/exports")).length).toBe(2));
    fireEvent.click(screen.getByRole("button", { name: "Restore to safe copy" })); await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/restore"))).toBe(true));
    fireEvent.click(screen.getByRole("button", { name: "Checkpoint and restore current" })); await waitFor(() => expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("/restore")).length).toBe(2));

    const input = screen.getByLabelText("Preview import"); fireEvent.change(input, { target: { files: [new File(["# Imported\nPreview only"], "import.md", { type: "text/markdown" })] } });
    expect(await screen.findByText("No chapter changes until confirmation.")).toBeInTheDocument(); expect(screen.getByText("Preview only")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm chapter import" })); await waitFor(() => expect(screen.queryByText("No chapter changes until confirmation.")).not.toBeInTheDocument());
  });

  it("reports support failure without removing controls", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false })); render(<PortabilityPanel projectId="00000000-0000-4000-a000-000000000001" />); await screen.findByText("Unavailable; writing unaffected"); fireEvent.click(screen.getByRole("button", { name: "Create verified snapshot" })); expect(await screen.findByText("The history service is unavailable. Writing remains available.")).toBeInTheDocument();
  });

  it("disables server-dependent controls when browser connectivity drops", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { snapshots: [], artifacts: [], imports: [] } }) }));
    render(<PortabilityPanel projectId="00000000-0000-4000-a000-000000000001" />); await screen.findByText("Ready");
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false }); window.dispatchEvent(new Event("offline"));
    expect(await screen.findByText("Unavailable offline")).toBeInTheDocument(); expect(screen.getByRole("button", { name: "Create verified snapshot" })).toBeDisabled();
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  });
});
