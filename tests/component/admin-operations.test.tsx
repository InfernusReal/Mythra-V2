import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminOperationsPanel } from "@/components/operations/AdminOperationsPanel";
import type { AdminOperationsSnapshot } from "@/domains/operations/application/ports";

export const adminFixture: AdminOperationsSnapshot = {
  actor: { userId: "f14278a4-18d1-401f-9714-1ae313c1b4b0", role: "OWNER" },
  workspace: { id: "a873e0d0-e22f-4cd0-a7f9-484546489adc", planKey: "core", archived: false, memberCount: 2, projectCount: 4 },
  subscription: { planKey: "CORE", status: "ACTIVE", graceEndsAt: null },
  quotas: [{ resource: "SNAPSHOT_BYTES", quantity: 2_048 }],
  jobs: [{ id: "f14278a4-18d1-401f-9714-1ae313c1b4b0", jobType: "projection.refresh", status: "FAILED", attempts: 3, errorCode: "DEPENDENCY_UNAVAILABLE", createdAt: "2026-09-01T00:00:00.000Z" }],
  exports: [{ id: "1a55dc4b-9841-4535-96d5-8b90576947f1", format: "TEXT", scope: "MANUSCRIPT", status: "VERIFIED", sizeBytes: 512, createdAt: "2026-09-01T00:00:00.000Z" }],
  snapshots: [{ id: "d40cd0f4-dbb3-422b-8c55-5e32ef84958e", status: "VERIFIED", sizeBytes: 1_024, createdAt: "2026-09-01T00:00:00.000Z" }],
  audits: [{ id: "608b547d-41f8-449c-96c2-27b5fa3b058c", kind: "ADMIN_RECOVERY", targetType: "OUTBOX_EVENT", targetId: null, correlationId: "safe", createdAt: "2026-09-01T00:00:00.000Z" }],
  operations: [{ eventName: "writing.save", routeKey: "/api/v2/chapters/:id/draft", durationMs: 20, numericValue: 1, occurredAt: "2026-09-01T00:00:00.000Z" }]
};

describe("S16 restricted admin surface", () => {
  it("renders only bounded operational metadata with an accessible job table", () => {
    render(<AdminOperationsPanel snapshot={adminFixture} />);
    expect(screen.getByRole("heading", { name: "Workspace operations" })).toBeVisible();
    const jobs = screen.getByRole("region", { name: "Operational jobs" });
    expect(within(jobs).getByRole("cell", { name: "projection.refresh" })).toBeVisible();
    expect(within(screen.getByRole("region", { name: "Export jobs" })).getByRole("cell", { name: "MANUSCRIPT" })).toBeVisible();
    expect(within(screen.getByRole("region", { name: "Snapshot jobs" })).getByRole("cell", { name: "1024" })).toBeVisible();
    expect(screen.getByText(/f14278a4-18d1-401f-9714-1ae313c1b4b0 \(OWNER\)/u)).toBeVisible();
    expect(screen.getByText(/Content-safe operational metadata only/u)).toBeVisible();
    expect(document.body.textContent).not.toContain("private manuscript fixture");
  });

  it("requires a server preview and exact typed confirmation for bounded recovery", async () => {
    const preview = { recoveryId: "46a46366-98d3-4d92-a76d-850c0f880d3f", confirmationToken: "signed-confirmation-token-that-is-longer-than-forty-characters", expiresAt: "2026-09-01T00:05:00.000Z", requiredPhrase: "REQUEUE OUTBOX" };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: preview }), { status: 200, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { completed: true } }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminOperationsPanel snapshot={adminFixture} recoveryEnabled />);
    fireEvent.click(screen.getByRole("button", { name: "Preview requeue" }));
    const confirmation = await screen.findByLabelText("Type REQUEUE OUTBOX");
    expect(screen.getByRole("button", { name: "Confirm requeue" })).toBeDisabled();
    fireEvent.change(confirmation, { target: { value: "REQUEUE OUTBOX" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm requeue" }));
    await waitFor(() => expect(screen.getByText(/Outbox event requeued/u)).toBeVisible());
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]?.body).not.toContain(preview.confirmationToken);
    expect(fetchMock.mock.calls[1]?.[1]?.body).toContain(preview.confirmationToken);
    vi.unstubAllGlobals();
  });
});
