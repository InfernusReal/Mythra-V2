"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { localizedErrorMessage } from "@/lib/i18n/messages";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCommandHandlers } from "@/lib/commands/use-command-handlers";

interface MutationEnvelope<T> {
  data?: T;
  error?: { message: string };
}

export function ProjectCreator() {
  const { messages } = useLocale();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);
  useCommandHandlers([
    {
      id: "project.create",
      available: () => !busy,
      execute: () => {
        titleRef.current?.focus();
      },
    },
  ]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const projectResponse = await fetch("/api/v2/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const project = (await projectResponse.json()) as MutationEnvelope<{
        id: string;
      }>;
      if (!project.data)
        throw new Error(
          localizedErrorMessage(
            messages,
            project.error,
            messages.projectCreationFailed,
          ),
        );

      const chapterResponse = await fetch(
        `/api/v2/projects/${project.data.id}/chapters`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: messages.defaultChapterTitle }),
        },
      );
      const chapter = (await chapterResponse.json()) as MutationEnvelope<{
        chapter: { id: string };
      }>;
      if (!chapter.data)
        throw new Error(
          localizedErrorMessage(
            messages,
            chapter.error,
            messages.chapterCreationFailed,
          ),
        );

      // Console trace S1-FLOW-001: project-to-first-chapter navigation completed; titles and document content are excluded.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S1-FLOW-001",
          event: "writing.first_chapter_ready",
          projectId: project.data.id,
          chapterId: chapter.data.chapter.id,
        }),
      );
      router.push(`/app/chapters/${chapter.data.chapter.id}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : messages.theFirstChapterCouldNotBeOpened,
      );
      setBusy(false);
    }
  }

  return (
    <form className="project-create" onSubmit={submit}>
      <label>
        {" "}
        {messages.projectTitle}{" "}
        <input
          ref={titleRef}
          required
          maxLength={240}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          autoFocus
        />
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="primary-action" disabled={busy}>
        {busy ? messages.creating : messages.writeFirstChapter}
      </button>
    </form>
  );
}
