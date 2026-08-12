export const errorCodes = [
  "VALIDATION",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "QUOTA_EXCEEDED",
  "RATE_LIMITED",
  "DEPENDENCY_UNAVAILABLE",
  "RETRYABLE",
  "INTEGRITY_ERROR",
  "INTERNAL"
] as const;

export type ErrorCode = (typeof errorCodes)[number];

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number,
    public readonly safeDetails?: Readonly<Record<string, string | number | boolean>>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errors = {
  validation: (message = "The request is invalid.") => new AppError("VALIDATION", message, 400),
  unauthenticated: () => new AppError("UNAUTHENTICATED", "Authentication is required.", 401),
  forbidden: () => new AppError("FORBIDDEN", "This action is not permitted.", 403),
  notFound: () => new AppError("NOT_FOUND", "The requested resource was not found.", 404),
  conflict: (message = "The resource changed. Refresh and compare before continuing.") =>
    new AppError("CONFLICT", message, 409),
  rateLimited: () => new AppError("RATE_LIMITED", "Too many requests. Try again shortly.", 429),
  dependencyUnavailable: () =>
    new AppError("DEPENDENCY_UNAVAILABLE", "A supporting service is temporarily unavailable.", 503),
  retryable: () => new AppError("RETRYABLE", "The operation can be retried safely.", 503),
  integrity: () => new AppError("INTEGRITY_ERROR", "The request conflicts with stored integrity constraints.", 409),
  internal: () => new AppError("INTERNAL", "The request could not be completed.", 500)
} as const;

export function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : errors.internal();
}
