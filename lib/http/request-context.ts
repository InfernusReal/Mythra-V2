import { randomUUID } from "node:crypto";

export function requestIdFrom(headers: Headers): string {
  const candidate = headers.get("x-request-id");
  return candidate && /^[a-zA-Z0-9._:-]{8,128}$/.test(candidate) ? candidate : randomUUID();
}
