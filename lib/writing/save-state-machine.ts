export type SaveState = "CLEAN" | "DIRTY_LOCAL" | "SAVING" | "OFFLINE_DIRTY" | "CONFLICT" | "RECOVERABLE_LOCAL";
export type SaveEvent =
  | { type: "EDIT" }
  | { type: "SAVE_STARTED" }
  | { type: "SAVE_ACKNOWLEDGED"; changedDuringSave: boolean }
  | { type: "NETWORK_FAILED" }
  | { type: "CONFLICT_DETECTED" }
  | { type: "LOCAL_RECOVERED" }
  | { type: "CONFLICT_RESOLVED" };

export function reduceSaveState(state: SaveState, event: SaveEvent): SaveState {
  switch (event.type) {
    case "EDIT": return state === "CONFLICT" ? "CONFLICT" : "DIRTY_LOCAL";
    case "SAVE_STARTED": return state === "CONFLICT" ? "CONFLICT" : "SAVING";
    case "SAVE_ACKNOWLEDGED": return event.changedDuringSave ? "DIRTY_LOCAL" : "CLEAN";
    case "NETWORK_FAILED": return "OFFLINE_DIRTY";
    case "CONFLICT_DETECTED": return "CONFLICT";
    case "LOCAL_RECOVERED": return "RECOVERABLE_LOCAL";
    case "CONFLICT_RESOLVED": return "CLEAN";
  }
}

export const saveStateLabels: Record<SaveState, string> = {
  CLEAN: "Saved",
  DIRTY_LOCAL: "Saved locally",
  SAVING: "Saving",
  OFFLINE_DIRTY: "Offline — saved locally",
  CONFLICT: "Two versions need your choice",
  RECOVERABLE_LOCAL: "Recovered local draft"
};
