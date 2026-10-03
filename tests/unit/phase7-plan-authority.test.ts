// @vitest-environment node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  PHASE7_SEALED_COMMIT,
  PHASE7_WORKPLAN_SHA256,
  PHASE7X_WORKPLAN_SHA256,
  verifyPhase7PlanAuthority,
} from "@/scripts/phase7-plan-authority";

const historical = execFileSync("git", ["show", `${PHASE7_SEALED_COMMIT}:WorkPlan.md`], {
  encoding: "utf8",
  maxBuffer: 1024 * 1024,
});
const approved = readFileSync("WorkPlan.md", "utf8").replaceAll("\r\n", "\n");

describe("sealed Phase 7 and explicitly approved Phase 7X plan authority", () => {
  it("retains independent exact historical-plan validation", () => {
    expect(verifyPhase7PlanAuthority(historical, historical, "phase7")).toEqual({
      version: "phase7",
      historicalSha256: PHASE7_WORKPLAN_SHA256,
      currentSha256: PHASE7_WORKPLAN_SHA256,
    });
  });

  it("accepts only the approved append-only current plan with its original prefix", () => {
    expect(verifyPhase7PlanAuthority(historical, approved, "phase7x")).toEqual({
      version: "phase7x",
      historicalSha256: PHASE7_WORKPLAN_SHA256,
      currentSha256: PHASE7X_WORKPLAN_SHA256,
    });
  });

  it("permits Git line-ending normalization without relaxing content validation", () => {
    expect(verifyPhase7PlanAuthority(
      historical.replaceAll("\n", "\r\n"), approved.replaceAll("\n", "\r\n"), "phase7x",
    ).currentSha256).toBe(PHASE7X_WORKPLAN_SHA256);
  });

  it("rejects a substituted historical object", () => {
    expect(() => verifyPhase7PlanAuthority(`${historical} `, approved, "phase7x"))
      .toThrow("historical WorkPlan object");
  });

  it("rejects an edit inside original sections even when the appendix is retained", () => {
    expect(() => verifyPhase7PlanAuthority(historical, approved.replace("Mythra", "Altered"), "phase7x"))
      .toThrow("original sealed plan content");
  });

  it("rejects a removed original prefix", () => {
    expect(() => verifyPhase7PlanAuthority(historical, approved.slice(historical.length), "phase7x"))
      .toThrow("original sealed plan content");
  });

  it("rejects a missing appendix on the current validation path", () => {
    expect(() => verifyPhase7PlanAuthority(historical, historical, "phase7x"))
      .toThrow("appendix is missing or out of order");
  });

  it("rejects a reordered appendix", () => {
    expect(() => verifyPhase7PlanAuthority(historical, approved.replace("## 14. Phase 7X", "## 15. Phase 7X"), "phase7x"))
      .toThrow("appendix is missing or out of order");
  });

  it("rejects an edited approved appendix", () => {
    expect(() => verifyPhase7PlanAuthority(historical, approved.replace("### 14.12 Rollback", "### 14.12 Changed rollback"), "phase7x"))
      .toThrow("explicitly approved Phase 7X plan hash");
  });

  it("rejects arbitrary extra content after the approved appendix", () => {
    expect(() => verifyPhase7PlanAuthority(historical, `${approved}\n## 15. Unapproved\n`, "phase7x"))
      .toThrow("explicitly approved Phase 7X plan hash");
  });

  it("rejects truncated approved content", () => {
    expect(() => verifyPhase7PlanAuthority(historical, approved.slice(0, -1), "phase7x"))
      .toThrow("explicitly approved Phase 7X plan hash");
  });

  it("does not accept the new plan under the historical validation policy", () => {
    expect(() => verifyPhase7PlanAuthority(historical, approved, "phase7"))
      .toThrow("exact original plan");
  });

  it("rejects an unsupported runtime policy", () => {
    expect(() => verifyPhase7PlanAuthority(historical, approved, "unknown" as "phase7x"))
      .toThrow("version is unsupported");
  });

  it("checks each of the twelve appendix sections against content mutation", () => {
    for (let section = 1; section <= 12; section += 1) {
      const changed = approved.replace(`### 14.${section} `, `### 14.${section} Modified `);
      expect(changed).not.toBe(approved);
      expect(() => verifyPhase7PlanAuthority(historical, changed, "phase7x"))
        .toThrow("explicitly approved Phase 7X plan hash");
    }
  });

  it("rejects 1,000 distinct unauthorized tails without changing accepted authority", () => {
    for (let iteration = 0; iteration < 1000; iteration += 1) {
      expect(() => verifyPhase7PlanAuthority(historical, `${approved}\nUnapproved ${iteration}`, "phase7x"))
        .toThrow("explicitly approved Phase 7X plan hash");
    }
    expect(verifyPhase7PlanAuthority(historical, approved, "phase7x").currentSha256)
      .toBe(PHASE7X_WORKPLAN_SHA256);
  });
});
