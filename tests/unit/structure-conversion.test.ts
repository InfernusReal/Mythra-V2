import { describe, expect, it } from "vitest";
import { DormantFutureStructureConversion } from "@/domains/structure/application/conversion";

describe("future Structure conversion seam", () => {
  it("keeps Note conversion dormant until its canonical gate after S8 activates Capture through its typed registry", async () => {
    await expect(new DormantFutureStructureConversion().convert({ sourceType: "NOTE", sourceId: "source", projectId: "project" })).rejects.toMatchObject({ code: "DEPENDENCY_UNAVAILABLE", status: 503 });
  });
});
