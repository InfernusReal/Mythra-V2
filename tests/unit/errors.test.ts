import { describe, expect, it } from "vitest";
import { AppError, asAppError, errorCodes, errors } from "@/lib/contracts/errors";

describe("error contracts", () => {
  it("preserves the complete stable code catalog", () => {
    expect(errorCodes).toEqual([
      "VALIDATION", "UNAUTHENTICATED", "FORBIDDEN", "NOT_FOUND", "CONFLICT", "QUOTA_EXCEEDED",
      "RATE_LIMITED", "DEPENDENCY_UNAVAILABLE", "RETRYABLE", "INTEGRITY_ERROR", "INTERNAL"
    ]);
  });

  it("maps forbidden behavior to stable actionable output", () => {
    expect(errors.forbidden()).toMatchObject({ code: "FORBIDDEN", status: 403 });
  });

  it("constructs every standard failure without exposing runtime errors", () => {
    const results = [
      errors.validation(), errors.unauthenticated(), errors.notFound(), errors.conflict(), errors.rateLimited(),
      errors.dependencyUnavailable(), errors.internal()
    ];
    expect(results.map((error) => error.code)).toEqual([
      "VALIDATION", "UNAUTHENTICATED", "NOT_FOUND", "CONFLICT", "RATE_LIMITED", "DEPENDENCY_UNAVAILABLE", "INTERNAL"
    ]);
    const known = new AppError("INTEGRITY_ERROR", "Safe", 500);
    expect(asAppError(known)).toBe(known);
    expect(asAppError(new Error("raw secret"))).toMatchObject({ code: "INTERNAL", message: "The request could not be completed." });
  });
});
