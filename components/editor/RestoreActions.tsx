"use client";

import type { ConflictResolution } from "@/domains/writing/application/durability-ports";

export function RestoreActions({ compareOpen, onCompare, onResolve }: {
  compareOpen: boolean;
  onCompare(): void;
  onResolve(resolution: ConflictResolution): void;
}) {
  return (
    <div className="conflict-actions">
      <button onClick={onCompare} aria-expanded={compareOpen}>Compare</button>
      <button onClick={() => onResolve("KEEP_LOCAL")}>Keep local as new version</button>
      <button onClick={() => onResolve("KEEP_SERVER")}>Keep server</button>
      <button onClick={() => onResolve("DUPLICATE_RECOVERY")}>Duplicate as recovery copy</button>
    </div>
  );
}
