"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  formatBytes,
  formatNumber,
  localizedEnumLabel,
} from "@/lib/i18n/messages";

import { useCallback, useEffect, useState } from "react";
import { useNetworkStatus } from "@/lib/offline/use-network-status";
import { useCommandHandlers } from "@/lib/commands/use-command-handlers";

interface StatusModel {
  snapshots: Array<{
    id: string;
    status: string;
    structuralVersion: number;
    sizeBytes: string | null;
    requestedAt: string;
    verifiedAt: string | null;
    retentionUntil: string;
  }>;
  artifacts: Array<{
    id: string;
    scope: string;
    format: string;
    status: string;
    sizeBytes: string | null;
    expiresAt: string | null;
  }>;
  imports: Array<{
    id: string;
    format: string;
    status: string;
    chapterCount: number;
  }>;
}
interface PreviewModel {
  importId: string;
  preview: {
    chapters: Array<{ title: string; bodyText: string; wordCount: number }>;
    warningCodes: string[];
  };
}

function requestKey(prefix: string): string {
  return `${prefix}:${crypto.randomUUID()}`;
}

export function PortabilityPanel({
  projectId,
  online = true,
}: {
  projectId: string;
  online?: boolean;
}) {
  const { messages, locale } = useLocale();
  const browserOnline = useNetworkStatus();
  const isOnline = online && browserOnline;
  const [status, setStatus] = useState<StatusModel | null>(null);
  const [preview, setPreview] = useState<PreviewModel | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [message, setMessage] = useState("");
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await fetch(
          `/api/v2/projects/${projectId}/portability`,
          { cache: "no-store", signal },
        );
        if (!response.ok) throw new Error(messages.portabilityUnavailable);
        const envelope = (await response.json()) as { data: StatusModel };
        setStatus(envelope.data);
        setUnavailable(false); // Console trace S13-UI-001: status applies only bounded artifact states, counts, versions and dates.
        console.log(
          JSON.stringify({
            level: "info",
            step: "S13-UI-001",
            event: "portability.status_applied",
            projectId,
            snapshotCount: envelope.data.snapshots.length,
            artifactCount: envelope.data.artifacts.length,
            importCount: envelope.data.imports.length,
          }),
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setUnavailable(true); // Console trace S13-UI-002: support-surface failure is content-free and does not alter editor availability.
        console.log(
          JSON.stringify({
            level: "warn",
            step: "S13-UI-002",
            event: "portability.status_unavailable",
            projectId,
            errorCode: "DEPENDENCY_UNAVAILABLE",
          }),
        );
      }
    },
    [messages.portabilityUnavailable, projectId],
  );
  useEffect(() => {
    const controller = new AbortController();
    const initial = window.setTimeout(() => void refresh(controller.signal), 0);
    return () => {
      controller.abort();
      window.clearTimeout(initial);
    };
  }, [refresh]);

  const mutate = async (key: string, url: string, body?: unknown) => {
    setBusy(key);
    setMessage("");
    try {
      const response = await fetch(url, {
        method: "POST",
        ...(body === undefined
          ? {}
          : {
              headers: { "content-type": "application/json" },
              body: JSON.stringify(body),
            }),
      });
      if (!response.ok) throw new Error(messages.portabilityMutationFailed);
      const envelope = (await response.json()) as {
        data?: Record<string, unknown>;
      }; // Console trace S13-UI-003: successful history mutation logs only action and resulting stable identities.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S13-UI-003",
          event: "portability.mutation_completed",
          projectId,
          action: key,
          resultId: String(
            envelope.data?.snapshotId ??
              envelope.data?.artifactId ??
              envelope.data?.projectId ??
              "",
          ),
        }),
      );
      setMessage(messages.operationCompletedAndVerified);
      await refresh();
      return envelope.data;
    } catch {
      setUnavailable(true);
      setMessage(
        messages.theHistoryServiceIsUnavailableWritingRemainsAvailable,
      ); // Console trace S13-UI-004: failed history mutation uses a stable code and explicitly preserves writing flow.
      console.log(
        JSON.stringify({
          level: "warn",
          step: "S13-UI-004",
          event: "portability.mutation_failed",
          projectId,
          action: key,
          errorCode: "RETRYABLE",
        }),
      );
      return undefined;
    } finally {
      setBusy(null);
    }
  };

  const createSnapshot = () =>
    mutate("snapshot", `/api/v2/projects/${projectId}/portability/snapshots`, {
      idempotencyKey: requestKey("manual-snapshot"),
    });
  const createExport = (
    scope: "MANUSCRIPT" | "FULL_PROJECT",
    format: "MARKDOWN" | "MYTHRA_JSON",
  ) =>
    mutate(
      `export-${scope}`,
      `/api/v2/projects/${projectId}/portability/exports`,
      { idempotencyKey: requestKey(`export-${scope}`), scope, format },
    );
  const restore = (snapshotId: string, mode: "SAFE_COPY" | "CURRENT") =>
    mutate(
      `restore-${mode}-${snapshotId}`,
      `/api/v2/projects/${projectId}/portability/snapshots/${snapshotId}/restore`,
      { mode },
    );
  const download = async (artifactId: string) => {
    setBusy(`download-${artifactId}`);
    try {
      const response = await fetch(
        `/api/v2/projects/${projectId}/portability/artifacts/${artifactId}/access`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error(messages.accessFailed);
      const envelope = (await response.json()) as {
        data: { downloadUrl: string };
      }; // Console trace S13-UI-005: download handoff logs artifact identity but never the signed URL or token.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S13-UI-005",
          event: "portability.download_handoff",
          projectId,
          artifactId,
        }),
      );
      window.location.assign(envelope.data.downloadUrl);
    } catch {
      setMessage(messages.theExportDownloadIsUnavailableOrExpired);
    } finally {
      setBusy(null);
    }
  };
  const upload = async (file: File, format: "TEXT" | "MARKDOWN" | "DOCX") => {
    setBusy("import-preview");
    const form = new FormData();
    form.set("file", file);
    form.set("format", format);
    form.set("idempotencyKey", requestKey("import"));
    try {
      const response = await fetch(
        `/api/v2/projects/${projectId}/portability/imports/preview`,
        { method: "POST", body: form },
      );
      if (!response.ok) throw new Error(messages.previewFailed);
      const envelope = (await response.json()) as { data: PreviewModel };
      setPreview(envelope.data); // Console trace S13-UI-006: import preview logs only format and bounded chapter/warning counts, not titles or imported text.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S13-UI-006",
          event: "portability.import_preview_applied",
          projectId,
          format,
          chapterCount: envelope.data.preview.chapters.length,
          warningCount: envelope.data.preview.warningCodes.length,
        }),
      );
    } catch {
      setMessage(messages.theFileCouldNotBePreviewedNoChapterWasChanged);
    } finally {
      setBusy(null);
    }
  };
  const confirmImport = async () => {
    if (!preview) return;
    const result = await mutate(
      "import-confirm",
      `/api/v2/projects/${projectId}/portability/imports/${preview.importId}/confirm`,
    );
    if (result) setPreview(null);
  };

  const disabled = !isOnline || busy !== null;
  useCommandHandlers([
    {
      id: "portability.snapshot",
      projectId,
      available: () => !disabled,
      execute: async () => Boolean(await createSnapshot()),
    },
    {
      id: "portability.manuscript",
      projectId,
      available: () => !disabled,
      execute: async () =>
        Boolean(await createExport("MANUSCRIPT", "MARKDOWN")),
    },
    {
      id: "portability.archive",
      projectId,
      available: () => !disabled,
      execute: async () =>
        Boolean(await createExport("FULL_PROJECT", "MYTHRA_JSON")),
    },
  ]);
  return (
    <section className="portability-panel" aria-labelledby="portability-title">
      <header>
        <div>
          <p className="eyebrow">{messages.historyAndPortability}</p>
          <h2 id="portability-title">
            {messages.snapshotsRestoreImportAndExport}
          </h2>
        </div>
        <span role="status" aria-live="polite">
          {!isOnline
            ? messages.unavailableOffline
            : unavailable
              ? messages.unavailableWritingUnaffected
              : busy
                ? messages.working
                : messages.ready}
        </span>
      </header>
      <div className="portability-actions">
        <button
          type="button"
          disabled={disabled}
          onClick={() => void createSnapshot()}
        >
          {messages.createVerifiedSnapshot}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => void createExport("MANUSCRIPT", "MARKDOWN")}
        >
          {messages.exportManuscript}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => void createExport("FULL_PROJECT", "MYTHRA_JSON")}
        >
          {messages.exportFullProjectArchive}
        </button>
        <label>
          {messages.previewImport}
          <input
            type="file"
            disabled={disabled}
            accept=".txt,.md,.markdown,.docx,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (!file) return;
              const extension = file.name.toLowerCase().split(".").pop();
              void upload(
                file,
                extension === "docx"
                  ? "DOCX"
                  : extension === "md" || extension === "markdown"
                    ? "MARKDOWN"
                    : "TEXT",
              );
            }}
          />
        </label>
      </div>
      {message ? <p role="status">{message}</p> : null}
      {preview ? (
        <section
          className="import-preview"
          aria-labelledby="import-preview-title"
        >
          <h3 id="import-preview-title">{messages.importPreview}</h3>
          <p>{messages.noChapterChangesUntilConfirmation}</p>
          <ol>
            {preview.preview.chapters.map((chapter, index) => (
              <li key={`${index}-${chapter.wordCount}`}>
                <strong>{chapter.title}</strong>
                <span>
                  {formatNumber(locale, chapter.wordCount)} {messages.words}
                </span>
                <p>{chapter.bodyText.slice(0, 240)}</p>
              </li>
            ))}
          </ol>
          <div>
            <button
              type="button"
              disabled={disabled}
              onClick={() => void confirmImport()}
            >
              {messages.confirmChapterImport}
            </button>
            <button type="button" onClick={() => setPreview(null)}>
              {messages.cancel}
            </button>
          </div>
        </section>
      ) : null}
      <details>
        <summary>
          {messages.verifiedSnapshots}
          {formatNumber(locale, status?.snapshots.length ?? 0)})
        </summary>
        <ul>
          {status?.snapshots.map((snapshot) => (
            <li key={snapshot.id}>
              <span>
                {messages.structureV}
                {formatNumber(locale, snapshot.structuralVersion)} ·{" "}
                {localizedEnumLabel(messages, snapshot.status)} ·{" "}
                {formatBytes(locale, Number(snapshot.sizeBytes ?? 0))}
              </span>
              {snapshot.status === "VERIFIED" ? (
                <div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => void restore(snapshot.id, "SAFE_COPY")}
                  >
                    {messages.restoreToSafeCopy}
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => void restore(snapshot.id, "CURRENT")}
                  >
                    {messages.checkpointAndRestoreCurrent}
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </details>
      <details>
        <summary>
          {messages.exportArtifacts}
          {formatNumber(locale, status?.artifacts.length ?? 0)})
        </summary>
        <ul>
          {status?.artifacts.map((artifact) => (
            <li key={artifact.id}>
              <span>
                {localizedEnumLabel(messages, artifact.scope)} ·{" "}
                {localizedEnumLabel(messages, artifact.format)} ·{" "}
                {localizedEnumLabel(messages, artifact.status)}
              </span>
              {artifact.status === "VERIFIED" ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => void download(artifact.id)}
                >
                  {messages.download}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
