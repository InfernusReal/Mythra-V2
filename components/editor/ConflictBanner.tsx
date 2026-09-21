"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";

import type {
  ConflictResolution,
  DraftConflictReadModel,
} from "@/domains/writing/application/durability-ports";
import { RestoreActions } from "./RestoreActions";
import { RevisionDiff } from "./RevisionDiff";

export function ConflictBanner({
  conflict,
  compareOpen,
  onCompare,
  onResolve,
}: {
  conflict: DraftConflictReadModel;
  compareOpen: boolean;
  onCompare(): void;
  onResolve(resolution: ConflictResolution): void;
}) {
  const { messages } = useLocale();
  return (
    <section className="conflict-banner" aria-labelledby="conflict-title">
      <h2 id="conflict-title">{messages.twoVersionsNeedYourChoice}</h2>
      <p>{messages.yourLocalDraftAndTheSavedVersionAreBothPreserved}</p>
      <RestoreActions
        compareOpen={compareOpen}
        onCompare={onCompare}
        onResolve={onResolve}
      />
      {compareOpen ? (
        <RevisionDiff
          localDocument={conflict.localDocument}
          serverDocument={conflict.serverDocument}
        />
      ) : null}
    </section>
  );
}
