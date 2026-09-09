import { describe, expect, it } from "vitest";
import { finiteInputNumber } from "@/lib/forms/numeric-input";

describe("finiteInputNumber", () => {
  it("preserves finite browser values", () => {
    expect(finiteInputNumber({ valueAsNumber: 12.5 }, 0)).toBe(12.5);
  });

  it("uses the field-specific fallback for non-finite browser values", () => {
    expect(finiteInputNumber({ valueAsNumber: Number.NaN }, 1)).toBe(1);
    expect(finiteInputNumber({ valueAsNumber: Number.POSITIVE_INFINITY }, 0)).toBe(0);
  });
});
