import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { claimEarlyCommandIntent, earlyCommandIntentScript, installEarlyCommandIntent } from "@/lib/commands/early-intent";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  window.history.replaceState(null, "", "/app/projects/synthetic/structure?returnChapterId=synthetic");
  const state = installEarlyCommandIntent(window);
  state.ready = false; state.pendingAt = null; state.pendingRoute = null;
});
afterEach(() => {
  window.__mythraCommandIntentV1!.ready = true;
  vi.restoreAllMocks();
});
function press(overrides: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, cancelable: true, ...overrides });
  window.dispatchEvent(event); return event;
}

describe("document-memory early command intent", () => {
  it("retains one intent, then opens once after readiness without executing a command", () => {
    const open = vi.fn(); const storage = vi.spyOn(Storage.prototype, "setItem");
    expect(press().defaultPrevented).toBe(true);
    for (let index = 0; index < 1000; index++) press({ repeat: true });
    expect(open).not.toHaveBeenCalled();
    const release = claimEarlyCommandIntent(open);
    expect(open).toHaveBeenCalledOnce();
    expect(window.__mythraCommandIntentV1).toMatchObject({ ready: true, pendingAt: null, pendingRoute: null });
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(storage).not.toHaveBeenCalled();
    press(); expect(open).toHaveBeenCalledOnce();
    release(); expect(window.__mythraCommandIntentV1!.ready).toBe(false);
  });
  it("preserves Cmd+K and does not queue while the mounted palette owns keyboard handling", () => {
    window.__mythraCommandIntentV1!.ready = true;
    expect(press().defaultPrevented).toBe(false);
    window.__mythraCommandIntentV1!.ready = false;
    expect(press({ ctrlKey: false, metaKey: true }).defaultPrevented).toBe(true);
    const open = vi.fn(); claimEarlyCommandIntent(open); expect(open).toHaveBeenCalledOnce();
  });
  it.each([
    { isComposing: true }, { keyCode: 229 }, { altKey: true }, { shiftKey: true },
    { ctrlKey: false }, { key: "s" },
  ])("does not capture IME or other shortcut combinations: %j", (override) => {
    expect(press(override).defaultPrevented).toBe(false);
    expect(window.__mythraCommandIntentV1!.pendingAt).toBeNull();
  });
  it.each(["/sign-in", "/", "/apple"])("does not capture outside application routes: %s", (route) => {
    window.history.replaceState(null, "", route);
    expect(press().defaultPrevented).toBe(false);
  });
  it("does not steal a key from an existing modal", () => {
    const modal = document.createElement("section"); modal.setAttribute("aria-modal", "true"); document.body.append(modal);
    expect(press().defaultPrevented).toBe(false); modal.remove();
  });
  it.each(["expired", "future", "route"])("discards an invalid pending intent: %s", (reason) => {
    press();
    if (reason === "route") window.history.replaceState(null, "", "/app/projects/another/structure");
    else window.__mythraCommandIntentV1!.pendingAt = Date.now() + (reason === "future" ? 1000 : -11_000);
    const open = vi.fn(); claimEarlyCommandIntent(open);
    expect(open).not.toHaveBeenCalled();
    expect(window.__mythraCommandIntentV1!.pendingAt).toBeNull();
    expect(console.log).toHaveBeenLastCalledWith(expect.stringContaining('"accepted":false'));
  });
  it("has one document listener and a self-contained inline bootstrap", () => {
    const listener = vi.spyOn(window, "addEventListener");
    for (let index = 0; index < 1000; index++) installEarlyCommandIntent(window);
    expect(listener).not.toHaveBeenCalled();
    window.eval(earlyCommandIntentScript);
    expect(press().defaultPrevented).toBe(true);
    const open = vi.fn(); claimEarlyCommandIntent(open); expect(open).toHaveBeenCalledOnce();
    expect(vi.mocked(console.log).mock.calls.flat().join(" ")).not.toContain("synthetic");
    expect(vi.mocked(console.log).mock.calls.flat().join(" ")).not.toContain("returnChapterId");
  });
});
