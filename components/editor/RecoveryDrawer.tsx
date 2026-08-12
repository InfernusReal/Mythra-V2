"use client";

import type { RecoveryNotice } from "@/lib/writing/use-durable-chapter";

export function RecoveryDrawer({ chapterId, notice, onDismiss }: { chapterId: string; notice: RecoveryNotice; onDismiss(): void }) {
  const dismiss = () => {
    // Console trace S2-CLIENT-009: the recovery notice was acknowledged; prose and recovery content are excluded.
    console.log(JSON.stringify({ level: "info", step: "S2-CLIENT-009", event: "autosave.recovery_notice_dismissed", chapterId, kind: notice.kind }));
    onDismiss();
  };
  return (
    <section className="recovery-drawer" aria-labelledby="recovery-title">
      <div>
        <h2 id="recovery-title">{notice.kind === "RECOVERED" ? "Local draft recovered" : "Local recovery storage unavailable"}</h2>
        <p>{notice.kind === "RECOVERED" ? "The pending local draft was restored before server synchronization." : "The canonical chapter remains writable and server saving continues."}</p>
      </div>
      <button onClick={dismiss}>Dismiss</button>
    </section>
  );
}
