import { describe, expect, it } from "vitest";
import { DormantFutureStructureConversion } from "@/domains/structure/application/conversion";

describe("future Structure conversion seam", () => {
  it.each(["NOTE", "CAPTURE"] as const)("keeps %s conversion dormant until its canonical gate", async (sourceType) => {
    await expect(new DormantFutureStructureConversion().convert({ sourceType, sourceId: "source", projectId: "project" }))
      .rejects.toMatchObject({ code: "DEPENDENCY_UNAVAILABLE", status: 503 });
  });
});

