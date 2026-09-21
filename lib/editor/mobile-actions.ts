export const MOBILE_WRITING_ACTION = "mythra:mobile-writing-action";
export type MobileWritingAction = "capture" | "search" | "context" | "entity";

export function dispatchMobileWritingAction(action: MobileWritingAction): void {
  window.dispatchEvent(new CustomEvent<MobileWritingAction>(MOBILE_WRITING_ACTION, { detail: action }));
}
