"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";

import type { RecoveryNotice } from "@/lib/writing/use-durable-chapter";

export function RecoveryDrawer({
  chapterId,
  notice,
  onDismiss,
}: {
  chapterId: string;
  notice: RecoveryNotice;
  onDismiss(): void;
}) {
  const { messages } = useLocale();
  const dismiss = () => {
    // Console trace S2-CLIENT-009: the recovery notice was acknowledged; prose and recovery content are excluded.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S2-CLIENT-009",
        event: "autosave.recovery_notice_dismissed",
        chapterId,
        kind: notice.kind,
      }),
    );
    onDismiss();
  };
  return (
    <section className="recovery-drawer" aria-labelledby="recovery-title">
      <div>
        <h2 id="recovery-title">
          {notice.kind === "RECOVERED"
            ? messages.localDraftRecovered
            : messages.localRecoveryStorageUnavailable}
        </h2>
        <p>
          {notice.kind === "RECOVERED"
            ? messages.thePendingLocalDraftWasRestoredBeforeServerSynchronization
            : messages.theCanonicalChapterRemainsWritableAndServerSavingContinues}
        </p>
      </div>
      <button onClick={dismiss}>{messages.dismiss}</button>
    </section>
  );
}
