import { describe, expect, it } from "vitest";
import { archiveCollectionNames, assertManifestCompleteness, buildManifest, safeCopyId, verifyArchive } from "@/domains/portability/domain/representations";
import { projectArchiveFixture } from "@/tests/fixtures/portability";

describe("portability representation", () => {
  it("freezes every canonical collection and preserves causal identity/semantics through a verified round trip", () => {
    const archive = projectArchiveFixture(); const built = buildManifest(archive); const decoded = verifyArchive(built.bytes, built.manifest);
    expect(Object.keys(decoded.collections).sort()).toEqual([...archiveCollectionNames].sort());
    expect(decoded.collections.causalRelations[0]).toMatchObject({ sourceType: "STORY_CHANGE", sourceId: "20000000-0000-4000-a000-000000000001", targetType: "CHAPTER", relationType: "CAUSES", state: "ACTIVE", condition: "Only if selected", note: "Direct fact", provenanceType: "DIRECT", provenanceNote: "Author supplied" });
    assertManifestCompleteness(built.manifest, { chapters: 1, storyChanges: 1, causalRelations: 1 });
  });

  it("rejects corruption, omissions and unsupported versions", () => {
    const archive = projectArchiveFixture(); const built = buildManifest(archive); const corrupt = built.bytes.slice(); const index = corrupt.length - 2; corrupt[index] = (corrupt[index] ?? 0) ^ 1;
    expect(() => verifyArchive(corrupt, built.manifest)).toThrow();
    expect(() => assertManifestCompleteness(built.manifest, { chapters: 2 })).toThrow("ARCHIVE_SOURCE_COUNT_MISMATCH:chapters");
    const unsupported = { ...archive, representationVersion: "1" }; expect(() => verifyArchive(new TextEncoder().encode(JSON.stringify(unsupported)))).toThrow("ARCHIVE_VERSION_UNSUPPORTED");
  });

  it("creates deterministic valid-looking safe-copy identities without reusing source IDs", () => {
    const mapped = safeCopyId("00000000-0000-4000-a000-000000000001", "10000000-0000-4000-a000-000000000001");
    expect(mapped).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/); expect(mapped).not.toBe("10000000-0000-4000-a000-000000000001");
  });

  it("normalizes dates, bigints, arrays and toJSON values deterministically", () => {
    const first = buildManifest({ ...projectArchiveFixture(), project: { structuralVersion: 1, id: "00000000-0000-4000-a000-000000000001", when: new Date("2026-01-01T00:00:00.000Z"), bytes: 10n, decimal: { toJSON: () => "1.25" }, values: [2n, "x"] } });
    const second = buildManifest({ ...projectArchiveFixture(), project: { values: [2n, "x"], decimal: { toJSON: () => "1.25" }, bytes: 10n, when: new Date("2026-01-01T00:00:00.000Z"), id: "00000000-0000-4000-a000-000000000001", structuralVersion: 1 } });
    expect(first.manifest.archiveSha256).toBe(second.manifest.archiveSha256);
  });
});
