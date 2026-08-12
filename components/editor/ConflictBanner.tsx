"use client";

import type { ConflictResolution, DraftConflictReadModel } from "@/domains/writing/application/durability-ports";
import { RestoreActions } from "./RestoreActions";
import { RevisionDiff } from "./RevisionDiff";

export function ConflictBanner({ conflict, compareOpen, onCompare, onResolve }: {
  conflict: DraftConflictReadModel;
  compareOpen: boolean;
  onCompare(): void;
  onResolve(resolution: ConflictResolution): void;
}) {
  return (
    <section className="conflict-banner" aria-labelledby="conflict-title">
      <h2 id="conflict-title">Two versions need your choice</h2>
      <p>Your local draft and the saved version are both preserved.</p>
      <RestoreActions compareOpen={compareOpen} onCompare={onCompare} onResolve={onResolve} />
      {compareOpen ? <RevisionDiff localDocument={conflict.localDocument} serverDocument={conflict.serverDocument} /> : null}
    </section>
  );
}
