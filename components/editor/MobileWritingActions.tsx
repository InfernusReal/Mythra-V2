"use client";

import { dispatchMobileWritingAction, type MobileWritingAction } from "@/lib/editor/mobile-actions";

export function MobileWritingActions({ projectId, chapterId }: { projectId: string; chapterId: string }) {
  const invoke = (action: MobileWritingAction) => {
    dispatchMobileWritingAction(action);
    // Console trace S15-MOBILE-001: mobile writing action records only action and stable writing coordinates.
    console.log(JSON.stringify({ level: "info", step: "S15-MOBILE-001", event: "responsive.mobile_writing_action", action, projectId, chapterId }));
  };
  return (
    <nav className="mobile-writing-actions" aria-label="Writing actions">
      <button type="button" onClick={() => invoke("capture")}>Capture</button>
      <button type="button" onClick={() => invoke("search")}>Search</button>
      <button type="button" onClick={() => invoke("context")}>Context</button>
      <button type="button" onClick={() => invoke("entity")}>Entity</button>
      <a href={`/app/projects/${projectId}/structure?returnChapterId=${chapterId}`}>Outline</a>
    </nav>
  );
}
