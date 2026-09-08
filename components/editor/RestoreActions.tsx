"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";

import type { ConflictResolution } from "@/domains/writing/application/durability-ports";

export function RestoreActions({
  compareOpen,
  onCompare,
  onResolve,
}: {
  compareOpen: boolean;
  onCompare(): void;
  onResolve(resolution: ConflictResolution): void;
}) {
  const { messages } = useLocale();
  return (
    <div className="conflict-actions">
      <button onClick={onCompare} aria-expanded={compareOpen}>
        {messages.compare}
      </button>
      <button onClick={() => onResolve("KEEP_LOCAL")}>
        {messages.keepLocalAsNewVersion}
      </button>
      <button onClick={() => onResolve("KEEP_SERVER")}>
        {messages.keepServer}
      </button>
      <button onClick={() => onResolve("DUPLICATE_RECOVERY")}>
        {messages.duplicateAsRecoveryCopy}
      </button>
    </div>
  );
}
