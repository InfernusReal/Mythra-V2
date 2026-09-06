import { z } from "zod";

const timestampSchema = z.string().datetime();
const idSchema = z.string().uuid();

/** Both existing descending sort keys; timestamp-only cursors remain accepted for older callers. */
export const listCursorSchema = z.string().max(80).refine((value) => {
  const [timestamp, id, extra] = value.split("|");
  return extra === undefined && timestampSchema.safeParse(timestamp).success && (id === undefined || idSchema.safeParse(id).success);
}, "Invalid list cursor.");

export function encodeListCursor(row: { id: string }, timestamp: Date): string {
  return listCursorSchema.parse(`${timestamp.toISOString()}|${row.id}`);
}

export function descendingCursorWhere(field: "capturedAt" | "updatedAt", raw?: string) {
  if (!raw) return {};
  const [timestamp, id] = listCursorSchema.parse(raw).split("|");
  const date = new Date(timestamp!);
  return id
    ? { OR: [{ [field]: { lt: date } }, { [field]: date, id: { lt: id } }] }
    : { [field]: { lt: date } };
}
