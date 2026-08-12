import { errors } from "@/lib/contracts/errors";

export interface ReorderPreview<T extends string = string> {
  orderedIds: T[];
  renumbered: Array<{ id: T; from: number; to: number }>;
  referenceIdsPreserved: true;
}

export function assertUniqueOrder(ids: readonly string[]): void {
  if (new Set(ids).size !== ids.length) throw errors.integrity();
}

export function previewReorder<T extends string>(currentIds: readonly T[], movedId: T, targetIndex: number): ReorderPreview<T> {
  assertUniqueOrder(currentIds);
  if (!currentIds.includes(movedId)) throw errors.notFound();
  if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= currentIds.length) throw errors.validation("The target order is outside the current range.");
  const before = new Map(currentIds.map((id, index) => [id, index]));
  const orderedIds = currentIds.filter((id) => id !== movedId);
  orderedIds.splice(targetIndex, 0, movedId);
  return {
    orderedIds,
    renumbered: orderedIds.flatMap((id, to) => {
      const from = before.get(id)!;
      return from === to ? [] : [{ id, from, to }];
    }),
    referenceIdsPreserved: true
  };
}

export function assertProjectOwnership(projectId: string, candidateProjectIds: readonly string[]): void {
  if (candidateProjectIds.some((candidate) => candidate !== projectId)) throw errors.integrity();
}

export function assertExplicitHardTarget(targetWords: number | null | undefined, hardEnabled: boolean): void {
  if (hardEnabled && !targetWords) throw errors.validation("A hard creative target requires an explicit positive target.");
}

export function nextAvailableSequence(used: ReadonlySet<number>, preferred: number): number {
  let candidate = Math.max(0, preferred);
  while (used.has(candidate)) candidate += 1;
  return candidate;
}

