"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCommandHandlers } from "@/lib/commands/use-command-handlers";

export function StartFirstChapter({ projectId }: { projectId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const createRef = useRef<HTMLButtonElement>(null);
  useCommandHandlers([{ id: "chapter.create", projectId, available: () => !busy, execute: () => { createRef.current?.focus(); } }]);
  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/v2/projects/${projectId}/chapters`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: "Chapter 1" }) });
      const envelope = await response.json() as { data?: { chapter: { id: string } }; error?: { message: string } };
      if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? "The chapter could not be created.");
      // Console trace S3-HOME-CLIENT-001: empty-project continuation became writable; titles/content are excluded.
      console.log(JSON.stringify({ level: "info", step: "S3-HOME-CLIENT-001", event: "continuation.first_chapter_ready", projectId, chapterId: envelope.data.chapter.id }));
      router.push(`/app/chapters/${envelope.data.chapter.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The chapter could not be created.");
      setBusy(false);
    }
  };
  return <div>{error ? <p className="form-error" role="alert">{error}</p> : null}<button ref={createRef} className="primary-action" disabled={busy} onClick={() => void start()}>{busy ? "Opening..." : "Write first chapter"}</button></div>;
}
