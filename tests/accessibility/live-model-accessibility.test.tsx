import axe from "axe-core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LiveModelFreshness } from "@/components/live-model/LiveModelFreshness";

const projectId = "a0000000-0000-4000-8000-000000000012";
const base = { projectStructuralVersion: 8, projectionCount: 12, freshCount: 12, updatingCount: 0, staleCount: 0, failedCount: 0, pendingEventCount: 0, processingEventCount: 0, failedEventCount: 0, lagMilliseconds: 0, warnings: [] };

function response(data: unknown, ok = true): Response {
  return { ok, json: async () => ({ data }) } as Response;
}

afterEach(() => vi.restoreAllMocks());

describe("Live Story Model freshness accessibility and degradation", () => {
  it("announces fresh status without serious accessibility violations", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(base)));
    const { container } = render(<LiveModelFreshness projectId={projectId} allowRepair />);
    await screen.findByText("Story model current");
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite"); expect(screen.queryByRole("button", { name: /repair/iu })).not.toBeInTheDocument();
    const results = await axe.run(container); expect(results.violations.filter((item) => item.impact === "critical" || item.impact === "serious")).toEqual([]);
  });

  it("shows truthful updating, stale, and unavailable states without blocking adjacent writing", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ ...base, freshCount: 11, updatingCount: 1, pendingEventCount: 1 }))
      .mockResolvedValueOnce(response({ ...base, freshCount: 11, staleCount: 1 }))
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    const { rerender } = render(<><textarea aria-label="Manuscript" defaultValue="Writable" /><LiveModelFreshness projectId={projectId} allowRepair /></>);
    await screen.findByText("Story model updating"); expect(screen.getByLabelText("Manuscript")).not.toBeDisabled();
    rerender(<><textarea aria-label="Manuscript" defaultValue="Writable" /><LiveModelFreshness projectId={`${projectId}-stale`} allowRepair /></>); await screen.findByText("Story model stale");
    rerender(<><textarea aria-label="Manuscript" defaultValue="Writable" /><LiveModelFreshness projectId={`${projectId}-offline`} allowRepair /></>); await screen.findByText("Story model unavailable"); expect(screen.getByLabelText("Manuscript")).not.toBeDisabled();
  });

  it("repairs from canonical data and suppresses only suppressible factual warnings", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const warning = { id: "warning", warningType: "DENSITY", message: "Several author-defined required milestones share the same chapter.", sourceType: "CHAPTER", sourceId: "chapter", suppressed: false, suppressible: true };
    const integrity = { id: "integrity", warningType: "HARD_PREREQUISITE_LOOP", message: "Active hard prerequisites form a cycle without explicit progression or mutual-state semantics.", sourceType: "CAUSAL_RELATION", sourceId: "relation", suppressed: false, suppressible: false };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ ...base, staleCount: 1, warnings: [warning, integrity] }))
      .mockResolvedValueOnce(response({ warningId: "warning", suppressed: true }))
      .mockResolvedValueOnce(response({ ...base, staleCount: 1, warnings: [{ ...warning, suppressed: true }, integrity] }))
      .mockResolvedValueOnce(response({ projectionCount: 12 }))
      .mockResolvedValueOnce(response(base));
    vi.stubGlobal("fetch", fetchMock); render(<LiveModelFreshness projectId={projectId} allowRepair />);
    await screen.findByText("Story model stale"); fireEvent.click(screen.getByText("2 factual warnings")); expect(screen.getByText("Integrity rule")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Suppress" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/warnings/warning"), expect.objectContaining({ method: "PATCH" })));
    fireEvent.click(screen.getByRole("button", { name: "Repair from canonical data" })); await screen.findByText("Story model current");
  });
});
