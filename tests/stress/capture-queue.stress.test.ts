import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { enqueueCapture, pendingCaptures } from "@/lib/indexed-db/capture-queue";

const record = (index: number) => ({ clientCaptureId: `stress-${index}`, projectId: "80000000-0000-4000-8000-000000000001", rawText: `Private stress ${index}`, route: "/app", entityContext: [], capturedAt: new Date(1_700_000_000_000 + index).toISOString() });
describe("Capture offline queue hard bounds", () => {
  beforeEach(async () => { await new Promise<void>((resolve) => { const request = indexedDB.deleteDatabase("mythra-capture-queue"); request.onsuccess = () => resolve(); request.onerror = () => resolve(); request.onblocked = () => resolve(); }); vi.spyOn(console, "log").mockImplementation(() => undefined); });
  it("accepts exactly 100 ordered items and rejects the 101st without eviction", async () => { const started = performance.now(); for (let index = 0; index < 100; index += 1) await enqueueCapture(record(index)); await expect(enqueueCapture(record(100))).rejects.toThrow("100-item limit"); const queued = await pendingCaptures(); expect(queued).toHaveLength(100); expect(queued[0]?.clientCaptureId).toBe("stress-0"); expect(queued.at(-1)?.clientCaptureId).toBe("stress-99"); expect(performance.now() - started).toBeLessThan(5_000); });
});
