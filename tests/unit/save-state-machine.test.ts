import { describe, expect, it } from "vitest";
import { reduceSaveState, saveStateLabels } from "@/lib/writing/save-state-machine";

describe("durability save-state machine", () => {
  it("covers every required state without alarmist copy", () => {
    expect(Object.keys(saveStateLabels).sort()).toEqual(["CLEAN", "CONFLICT", "DIRTY_LOCAL", "OFFLINE_DIRTY", "RECOVERABLE_LOCAL", "SAVING"]);
    expect(reduceSaveState("CLEAN", { type: "EDIT" })).toBe("DIRTY_LOCAL");
    expect(reduceSaveState("DIRTY_LOCAL", { type: "SAVE_STARTED" })).toBe("SAVING");
    expect(reduceSaveState("SAVING", { type: "SAVE_ACKNOWLEDGED", changedDuringSave: false })).toBe("CLEAN");
    expect(reduceSaveState("SAVING", { type: "SAVE_ACKNOWLEDGED", changedDuringSave: true })).toBe("DIRTY_LOCAL");
    expect(reduceSaveState("SAVING", { type: "NETWORK_FAILED" })).toBe("OFFLINE_DIRTY");
    expect(reduceSaveState("DIRTY_LOCAL", { type: "CONFLICT_DETECTED" })).toBe("CONFLICT");
    expect(reduceSaveState("CONFLICT", { type: "EDIT" })).toBe("CONFLICT");
    expect(reduceSaveState("CLEAN", { type: "LOCAL_RECOVERED" })).toBe("RECOVERABLE_LOCAL");
    expect(reduceSaveState("CONFLICT", { type: "CONFLICT_RESOLVED" })).toBe("CLEAN");
  });
});
