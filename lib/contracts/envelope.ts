import type { ErrorCode } from "./errors";

export interface Meta {
  requestId: string;
  timestamp: string;
}

export type SuccessEnvelope<T> = { data: T; meta: Meta };
export type ErrorEnvelope = {
  error: { code: ErrorCode; message: string; details?: Readonly<Record<string, string | number | boolean>> };
  meta: Meta;
};

export function success<T>(data: T, requestId: string): SuccessEnvelope<T> {
  return { data, meta: { requestId, timestamp: new Date().toISOString() } };
}

export function failure(
  code: ErrorCode,
  message: string,
  requestId: string,
  details?: Readonly<Record<string, string | number | boolean>>
): ErrorEnvelope {
  return {
    error: { code, message, ...(details ? { details } : {}) },
    meta: { requestId, timestamp: new Date().toISOString() }
  };
}
