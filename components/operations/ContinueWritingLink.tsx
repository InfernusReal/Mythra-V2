"use client";

import { recordClientOperationalEvent } from "@/lib/observability/client-operations";
import { useCommandHandlers } from "@/lib/commands/use-command-handlers";
import { useRouter } from "next/navigation";

export function ContinueWritingLink({ projectId, chapterId }: { projectId: string; chapterId: string }) {
  const router = useRouter();
  const recordContinue = () => {
    recordClientOperationalEvent({ projectId, eventName: "continuation.used", dimensions: { source: "project_home" } });
    // Console trace S16-FRICTION-007: Continue usage records the stable chapter identity and fixed source without project or chapter text.
    console.log(JSON.stringify({ level: "info", step: "S16-FRICTION-007", event: "friction.continue_used", chapterId, source: "project_home" }));
  };
  useCommandHandlers([{ id: "writing.continue", projectId, execute: () => { recordContinue(); router.push(`/app/chapters/${chapterId}`); } }]);
  return <a className="continue-writing" href={`/app/chapters/${chapterId}`} onClick={recordContinue}>Continue Writing</a>;
}
