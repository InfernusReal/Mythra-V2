"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  formatNumber,
  interpolateMessage,
  localizedEnumLabel,
  localizedErrorMessage,
} from "@/lib/i18n/messages";

import { useState } from "react";
import type { NoteReadModel } from "@/domains/notes/domain/types";
import type {
  ResearchItemReadModel,
  ResearchKind,
} from "@/domains/research/domain/types";

type Envelope<T> = { data?: T; error?: { message: string } };

export function ResearchWorkspace({
  projectId,
  initialNotes,
  initialItems,
  initialStructuralVersion,
  returnChapterId,
}: {
  projectId: string;
  initialNotes: NoteReadModel[];
  initialItems: ResearchItemReadModel[];
  initialStructuralVersion: number;
  returnChapterId?: string;
}) {
  const { messages, locale } = useLocale();
  const [notes, setNotes] = useState(initialNotes);
  const [items, setItems] = useState(initialItems);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [tags, setTags] = useState("");
  const [kind, setKind] = useState<Exclude<ResearchKind, "FILE">>("NOTE");
  const [researchTitle, setResearchTitle] = useState("");
  const [researchValue, setResearchValue] = useState("");
  const [status, setStatus] = useState("");
  const [structuralVersion, setStructuralVersion] = useState(
    initialStructuralVersion,
  );
  const [promotionNoteId, setPromotionNoteId] = useState("");
  const [promotionType, setPromotionType] = useState<
    "MILESTONE" | "STORY_CHANGE" | "CHAPTER_OUTLINE"
  >("STORY_CHANGE");

  const createNote = async () => {
    const response = await fetch(`/api/v2/projects/${projectId}/notes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: noteTitle,
        body: noteBody,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      }),
    });
    const payload = (await response.json()) as Envelope<{
      note: NoteReadModel;
    }>;
    if (!response.ok || !payload.data) {
      setStatus(
        localizedErrorMessage(
          messages,
          payload.error,
          messages.noteCouldNotBeSaved,
        ),
      );
      return;
    }
    setNotes((current) => [payload.data!.note, ...current]);
    setNoteTitle("");
    setNoteBody("");
    setTags("");
    setStatus(messages.durableNoteSaved);
    // Console trace S11-UI-002: Note UI completion logs identity/version/counts only and excludes Note content.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S11-UI-002",
        event: "notes.ui_created",
        projectId,
        sourceId: payload.data.note.id,
        version: payload.data.note.version,
        tagCount: payload.data.note.tags.length,
      }),
    );
  };

  const createResearch = async () => {
    const field =
      kind === "URL"
        ? "url"
        : kind === "EXCERPT"
          ? "excerpt"
          : kind === "CITATION"
            ? "citation"
            : "body";
    const response = await fetch(`/api/v2/projects/${projectId}/research`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind,
        title: researchTitle,
        [field]: researchValue,
      }),
    });
    const payload = (await response.json()) as Envelope<{
      item: ResearchItemReadModel;
    }>;
    if (!response.ok || !payload.data) {
      setStatus(
        localizedErrorMessage(
          messages,
          payload.error,
          messages.researchCouldNotBeSaved,
        ),
      );
      return;
    }
    setItems((current) => [payload.data!.item, ...current]);
    setResearchTitle("");
    setResearchValue("");
    setStatus(messages.researchItemSaved);
    // Console trace S11-UI-003: Research UI completion logs identity/kind/version only and excludes URLs, citations and excerpts.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S11-UI-003",
        event: "research.ui_created",
        projectId,
        sourceId: payload.data.item.id,
        kind: payload.data.item.kind,
        version: payload.data.item.version,
      }),
    );
  };

  const upload = async (file: File) => {
    const form = new FormData();
    form.set("file", file);
    const response = await fetch(
      `/api/v2/projects/${projectId}/research/assets`,
      { method: "POST", body: form },
    );
    const payload = (await response.json()) as Envelope<{ assetId: string }>;
    if (!response.ok || !payload.data) {
      setStatus(
        localizedErrorMessage(
          messages,
          payload.error,
          messages.fileValidationFailed,
        ),
      );
      return;
    }
    const itemResponse = await fetch(`/api/v2/projects/${projectId}/research`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: "FILE",
        title: file.name,
        assetId: payload.data.assetId,
      }),
    });
    const itemPayload = (await itemResponse.json()) as Envelope<{
      item: ResearchItemReadModel;
    }>;
    if (!itemResponse.ok || !itemPayload.data) {
      setStatus(
        localizedErrorMessage(
          messages,
          itemPayload.error,
          messages.theValidatedFileCouldNotBeAddedToResearch,
        ),
      );
      return;
    }
    setItems((current) => [itemPayload.data!.item, ...current]);
    setStatus(messages.privateFileValidatedScannedAndAddedToResearch);
    // Console trace S11-UI-004: upload UI completion logs asset identity/byte count/MIME only and excludes file name/content.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S11-UI-004",
        event: "research.ui_asset_ready",
        projectId,
        sourceId: payload.data.assetId,
        researchItemId: itemPayload.data.item.id,
        sizeBytes: file.size,
        contentType: file.type,
      }),
    );
  };

  const downloadAsset = async (assetId: string) => {
    const response = await fetch(
      `/api/v2/projects/${projectId}/research/assets/${assetId}/access`,
      { method: "POST" },
    );
    const payload = (await response.json()) as Envelope<{
      href: string;
      expiresInSeconds: number;
    }>;
    if (!response.ok || !payload.data) {
      setStatus(
        localizedErrorMessage(
          messages,
          payload.error,
          messages.privateFileAccessIsUnavailable,
        ),
      );
      return;
    }
    window.location.assign(payload.data.href);
    // Console trace S11-UI-005: private asset access logs asset identity and token lifetime only; signed URL/token and file metadata are excluded.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S11-UI-005",
        event: "research.ui_asset_accessed",
        projectId,
        sourceId: assetId,
        expiresInSeconds: payload.data.expiresInSeconds,
      }),
    );
  };

  const promoteNote = async () => {
    const response = await fetch(
      `/api/v2/projects/${projectId}/notes/promotions`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          noteId: promotionNoteId,
          targetType: promotionType,
          idempotencyKey: crypto.randomUUID(),
          expectedStructuralVersion: structuralVersion,
        }),
      },
    );
    const payload = (await response.json()) as Envelope<{
      targetId: string;
      targetType: string;
      projectStructuralVersion: number;
      replayed: boolean;
    }>;
    if (!response.ok || !payload.data) {
      setStatus(
        localizedErrorMessage(
          messages,
          payload.error,
          messages.notePromotionCouldNotBeCompleted,
        ),
      );
      return;
    }
    setStructuralVersion(payload.data.projectStructuralVersion);
    setStatus(
      interpolateMessage(messages.notePromotedWithProvenance, {
        targetType: localizedEnumLabel(messages, payload.data.targetType),
      }),
    );
    // Console trace S11-UI-007: Note promotion completion logs source/target/version identity only and excludes Note content.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S11-UI-007",
        event: "notes.ui_promoted",
        projectId,
        sourceId: promotionNoteId,
        targetType: payload.data.targetType,
        targetId: payload.data.targetId,
        structuralVersion: payload.data.projectStructuralVersion,
        replayed: payload.data.replayed,
      }),
    );
  };

  return (
    <section
      className="chronicle-workspace research-workspace"
      aria-labelledby="research-title"
    >
      <header className="chronicle-header research-header">
        <div>
          <p className="eyebrow">{messages.referenceWithoutContextSwitching}</p>
          <h1 id="research-title">{messages.notesAndResearch}</h1>
        </div>
        <a
          href={
            returnChapterId
              ? `/app/chapters/${returnChapterId}`
              : `/app/projects/${projectId}`
          }
        >
          {returnChapterId
            ? messages.returnToChapter
            : messages.returnToProjectHome}
        </a>
      </header>
      <p className="chronicle-intro research-intro">
        {
          messages.notesAreDurableReferencesNotCaptureInboxEntriesTagsAndBacklinksReplace
        }
      </p>
      <div className="chronicle-columns research-columns">
        <section className="research-column notes-column">
          <h2>{messages.notes}</h2>
          <form
            className="research-form note-create-form"
            onSubmit={(event) => {
              event.preventDefault();
              void createNote();
            }}
          >
            <label>
              {messages.title}
              <input
                required
                maxLength={200}
                value={noteTitle}
                onChange={(event) => setNoteTitle(event.target.value)}
              />
            </label>
            <label>
              {messages.body}
              <textarea
                maxLength={100000}
                value={noteBody}
                onChange={(event) => setNoteBody(event.target.value)}
              />
            </label>
            <label>
              {messages.tagsCommaSeparated}
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
              />
            </label>
            <button type="submit">{messages.saveNote}</button>
          </form>
          {notes.length ? (
            <form
              className="research-form note-promotion-form"
              onSubmit={(event) => {
                event.preventDefault();
                void promoteNote();
              }}
            >
              <label>
                {messages.note}
                <select
                  required
                  value={promotionNoteId}
                  onChange={(event) => setPromotionNoteId(event.target.value)}
                >
                  <option value="">{messages.chooseNote}</option>
                  {notes.map((note) => (
                    <option key={note.id} value={note.id}>
                      {note.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {messages.promoteInto}
                <select
                  value={promotionType}
                  onChange={(event) =>
                    setPromotionType(event.target.value as typeof promotionType)
                  }
                >
                  <option value="MILESTONE">{messages.milestone}</option>
                  <option value="STORY_CHANGE">{messages.storyChange}</option>
                  <option value="CHAPTER_OUTLINE">
                    {messages.chapterOutline}
                  </option>
                </select>
              </label>
              <button type="submit">{messages.promoteWithProvenance}</button>
            </form>
          ) : null}
          <ul className="chronicle-list research-list notes-list">
            {notes.map((note) => (
              <li className="note-item" key={note.id}>
                <div>
                  <strong>{note.title}</strong>
                  <span>{note.tags.join(" · ") || messages.noTags}</span>
                </div>
                <small>
                  {formatNumber(locale, note.backlinkCount)}{" "}
                  {messages.backlinks}
                </small>
              </li>
            ))}
          </ul>
        </section>
        <section className="research-column research-library-column">
          <h2>{messages.research}</h2>
          <form
            className="research-form research-create-form"
            onSubmit={(event) => {
              event.preventDefault();
              void createResearch();
            }}
          >
            <label>
              {messages.kind}
              <select
                value={kind}
                onChange={(event) =>
                  setKind(event.target.value as Exclude<ResearchKind, "FILE">)
                }
              >
                {["NOTE", "URL", "EXCERPT", "CITATION"].map((value) => (
                  <option key={value} value={value}>
                    {localizedEnumLabel(messages, value)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {messages.title}
              <input
                required
                maxLength={200}
                value={researchTitle}
                onChange={(event) => setResearchTitle(event.target.value)}
              />
            </label>
            <label>
              {kind === "URL"
                ? messages.url
                : kind === "CITATION"
                  ? messages.citation
                  : kind === "EXCERPT"
                    ? messages.userAuthoredExcerpt
                    : messages.researchNote}
              <textarea
                required
                value={researchValue}
                onChange={(event) => setResearchValue(event.target.value)}
              />
            </label>
            <button type="submit">{messages.addResearch}</button>
            <label className="research-file-control">
              {messages.privateFile}
              <input
                type="file"
                accept=".pdf,.txt,.md,.jpg,.jpeg,.png"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
            </label>
          </form>
          <ul className="chronicle-list research-list research-item-list">
            {items.map((item) => (
              <li className="research-item" data-kind={item.kind} key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{localizedEnumLabel(messages, item.kind)}</span>
                </div>
                <small>v{formatNumber(locale, item.version)}</small>
                {item.asset ? (
                  <button
                    type="button"
                    onClick={() => void downloadAsset(item.asset!.id)}
                  >
                    {messages.downloadPrivateFile}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <p className="chronicle-status research-status" role="status">
        {status}
      </p>
    </section>
  );
}
