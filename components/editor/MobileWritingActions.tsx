"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";

import {
  dispatchMobileWritingAction,
  type MobileWritingAction,
} from "@/lib/editor/mobile-actions";

export function MobileWritingActions({
  projectId,
  chapterId,
}: {
  projectId: string;
  chapterId: string;
}) {
  const { messages } = useLocale();
  const invoke = (action: MobileWritingAction) => {
    dispatchMobileWritingAction(action);
    // Console trace S15-MOBILE-001: mobile writing action records only action and stable writing coordinates.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S15-MOBILE-001",
        event: "responsive.mobile_writing_action",
        action,
        projectId,
        chapterId,
      }),
    );
  };
  return (
    <nav
      className="mobile-writing-actions"
      aria-label={messages.writingActions}
    >
      <button type="button" onClick={() => invoke("capture")}>
        {messages.capture}
      </button>
      <button type="button" onClick={() => invoke("search")}>
        {messages.search}
      </button>
      <button type="button" onClick={() => invoke("context")}>
        {messages.context}
      </button>
      <button type="button" onClick={() => invoke("entity")}>
        {messages.entity}
      </button>
      <a
        href={`/app/projects/${projectId}/structure?returnChapterId=${chapterId}`}
      >
        {messages.outline}
      </a>
    </nav>
  );
}
