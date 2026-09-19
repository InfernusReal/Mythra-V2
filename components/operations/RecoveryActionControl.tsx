"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";

import { useState } from "react";
import { formatDateTime, localizedErrorMessage } from "@/lib/i18n/messages";

type Envelope<T> = { data?: T; error?: { message: string } };
type Preview = {
  recoveryId: string;
  confirmationToken: string;
  expiresAt: string;
  requiredPhrase: "REQUEUE OUTBOX";
};

export function RecoveryActionControl({ targetId }: { targetId: string }) {
  const { messages, locale } = useLocale();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [phrase, setPhrase] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const requestPreview = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch("/api/v2/admin/recovery", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ operation: "PREVIEW", targetId }),
      });
      const envelope = (await response.json()) as Envelope<Preview>;
      if (!response.ok || !envelope.data)
        throw new Error(
          localizedErrorMessage(
            messages,
            envelope.error,
            messages.recoveryPreviewFailed,
          ),
        );
      setPreview(envelope.data);
      // Console trace S16-RECOVERY-003: admin recovery preview UI records stable identities and expiry; the confirmation token is excluded.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S16-RECOVERY-003",
          event: "operations.recovery_preview_displayed",
          targetId,
          recoveryId: envelope.data.recoveryId,
          expiresAt: envelope.data.expiresAt,
        }),
      );
    } catch (caught) {
      setStatus(
        caught instanceof Error
          ? caught.message
          : messages.recoveryPreviewFailed,
      );
    } finally {
      setBusy(false);
    }
  };
  const confirm = async () => {
    if (!preview) return;
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch("/api/v2/admin/recovery", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          operation: "CONFIRM",
          recoveryId: preview.recoveryId,
          targetId,
          confirmationToken: preview.confirmationToken,
          phrase,
        }),
      });
      const envelope = (await response.json()) as Envelope<{
        completed: boolean;
      }>;
      if (!response.ok || !envelope.data?.completed)
        throw new Error(
          localizedErrorMessage(
            messages,
            envelope.error,
            messages.recoveryConfirmationFailed,
          ),
        );
      setPreview(null);
      setPhrase("");
      setStatus(messages.outboxEventRequeuedRefreshToReadItsCurrentState);
      // Console trace S16-RECOVERY-004: admin recovery completion UI records stable identities and outcome; tokens and job payloads are excluded.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S16-RECOVERY-004",
          event: "operations.recovery_completed",
          targetId,
          recoveryId: preview.recoveryId,
          completed: true,
        }),
      );
    } catch (caught) {
      setStatus(
        caught instanceof Error
          ? caught.message
          : messages.recoveryConfirmationFailed,
      );
    } finally {
      setBusy(false);
    }
  };
  if (!preview)
    return (
      <div className="admin-recovery" data-state="idle">
        <button
          type="button"
          disabled={busy}
          onClick={() => void requestPreview()}
        >
          {messages.previewRequeue}
        </button>
        {status ? <p role="status">{status}</p> : null}
      </div>
    );
  return (
    <div className="admin-recovery" data-state="preview">
      <p>
        {messages.thisActionRequeuesOneFailedOutboxEventItDoesNotEditAuthor}{" "}
        <time dateTime={preview.expiresAt}>
          {formatDateTime(locale, new Date(preview.expiresAt))}
        </time>
        .
      </p>
      <label>
        {messages.type} {preview.requiredPhrase}
        <input
          value={phrase}
          onChange={(event) => setPhrase(event.target.value)}
          autoComplete="off"
        />
      </label>
      <button
        type="button"
        disabled={busy || phrase !== preview.requiredPhrase}
        onClick={() => void confirm()}
      >
        {messages.confirmRequeue}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setPreview(null);
          setPhrase("");
        }}
      >
        {messages.cancel}
      </button>
      {status ? <p role="status">{status}</p> : null}
    </div>
  );
}
