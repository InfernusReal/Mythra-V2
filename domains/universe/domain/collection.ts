export const universeBudgets = {
  pageDefault: 50,
  pageHard: 100,
  customFields: 100,
  entityRelations: 500,
  snapshots: 1_000,
  backlinksPerGroup: 100,
} as const;

export function boundedUniverseProjection<
  T extends {
    updatedAt: string;
    typeId: string;
    status: string;
    tags: string[];
  },
>(
  rows: readonly T[],
  query: { typeId?: string; status?: string; tag?: string; limit?: number },
): T[] {
  const limit = Math.min(
    universeBudgets.pageHard,
    Math.max(1, query.limit ?? universeBudgets.pageDefault),
  );
  return rows
    .filter(
      (row) =>
        (!query.typeId || row.typeId === query.typeId) &&
        (!query.status || row.status === query.status) &&
        (!query.tag || row.tags.includes(query.tag)),
    )
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, limit);
}
