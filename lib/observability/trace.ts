import { randomUUID } from "node:crypto";

export interface TraceContext {
  traceId: string;
  spanId: string;
  operation: string;
  startedAt: number;
}

export function startTrace(operation: string): TraceContext {
  return { traceId: randomUUID(), spanId: randomUUID(), operation, startedAt: performance.now() };
}

export function finishTrace(trace: TraceContext): { durationMs: number } {
  return { durationMs: Math.max(0, performance.now() - trace.startedAt) };
}
