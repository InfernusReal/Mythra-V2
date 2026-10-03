interface EarlyCommandIntent {
  version: 1;
  ready: boolean;
  pendingAt: number | null;
  pendingRoute: string | null;
}

declare global {
  interface Window { __mythraCommandIntentV1?: EarlyCommandIntent }
}

/** Dependency-free so its compiled function can run inline before React hydration. */
export function installEarlyCommandIntent(target: Window): EarlyCommandIntent {
  if (target.__mythraCommandIntentV1) return target.__mythraCommandIntentV1;
  const state: EarlyCommandIntent = { version: 1, ready: false, pendingAt: null, pendingRoute: null };
  target.__mythraCommandIntentV1 = state;
  target.addEventListener("keydown", (event: KeyboardEvent) => {
    if (state.ready || event.isComposing || event.keyCode === 229 || event.altKey || event.shiftKey ||
      !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k" ||
      !/^\/app(?:\/|$)/u.test(target.location.pathname) ||
      target.document.querySelector('[aria-modal="true"]')) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const first = state.pendingAt === null;
    state.pendingAt = Date.now(); state.pendingRoute = target.location.href;
    if (first) {
      // Console trace REL-COMMAND-001: one early palette intent is retained in document memory without content or routes.
      console.log(JSON.stringify({ level: "info", step: "REL-COMMAND-001", event: "command.early_intent_queued" }));
    }
  }, true);
  return state;
}

export const earlyCommandIntentScript = `(${installEarlyCommandIntent.toString()})(window);`;

/** Called only after the existing capture-phase keyboard handler has been installed. */
export function claimEarlyCommandIntent(open: () => void, target: Window = window): () => void {
  const state = installEarlyCommandIntent(target);
  state.ready = true;
  if (state.pendingAt !== null) {
    const accepted = state.pendingRoute === target.location.href &&
      Date.now() - state.pendingAt >= 0 && Date.now() - state.pendingAt <= 10_000;
    state.pendingAt = null; state.pendingRoute = null;
    // Console trace REL-COMMAND-002: hydration claims or discards the one bounded intent; no command executes before readiness.
    console.log(JSON.stringify({ level: "info", step: "REL-COMMAND-002", event: "command.early_intent_claimed", accepted }));
    if (accepted) open();
  }
  return () => { state.ready = false; };
}
