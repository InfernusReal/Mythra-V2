import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { enqueueCapture, pendingCaptures, syncCaptureQueue } from "@/lib/indexed-db/capture-queue";

const record = (id: string) => ({ clientCaptureId: id, projectId: "80000000-0000-4000-8000-000000000001", rawText: `Private ${id}`, route: "/app", entityContext: [], capturedAt: new Date().toISOString() });
describe("Capture offline queue", () => {
  beforeEach(async () => { await new Promise<void>((resolve) => { const request = indexedDB.deleteDatabase("mythra-capture-queue"); request.onsuccess = () => resolve(); request.onerror = () => resolve(); request.onblocked = () => resolve(); }); vi.spyOn(console, "log").mockImplementation(() => undefined); });
  it("queues, replays, and removes an idempotent raw Capture", async () => { await enqueueCapture(record("offline-1")); expect(await pendingCaptures()).toHaveLength(1); const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { capture: { id: "x" } } }), { status: 200 })); await expect(syncCaptureQueue(fetcher)).resolves.toEqual({ synced: 1, failed: 0 }); expect(await pendingCaptures()).toHaveLength(0); expect(String(fetcher.mock.calls[0]?.[1]?.body)).toContain("Private offline-1"); });
  it("retains a failed item with bounded exponential retry metadata", async () => { await enqueueCapture(record("offline-2")); await expect(syncCaptureQueue(vi.fn().mockRejectedValue(new Error("offline")))).resolves.toEqual({ synced: 0, failed: 1 }); expect(await pendingCaptures(Number.MAX_SAFE_INTEGER)).toMatchObject([{ clientCaptureId: "offline-2", attempts: 1, state: "ERROR" }]); });
});
