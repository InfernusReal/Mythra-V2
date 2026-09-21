import { describe, expect, it } from "vitest";
import { buildManifest, verifyArchive } from "@/domains/portability/domain/representations";
import { projectArchiveFixture } from "@/tests/fixtures/portability";

describe("portability stress", () => {
  it("builds and verifies a 25,000-object sparse archive under the instrumented budget", () => {
    const archive = projectArchiveFixture(); archive.collections.notes = Array.from({ length: 25_000 }, (_, index) => ({ id: `${index.toString(16).padStart(8, "0")}-0000-4000-a000-000000000001`, projectId: archive.project.id, version: 1 }));
    const started = performance.now(); const result = buildManifest(archive); const decoded = verifyArchive(result.bytes, result.manifest); const duration = performance.now() - started;
    expect(decoded.collections.notes).toHaveLength(25_000); expect(duration).toBeLessThan(5_000); expect(result.bytes.byteLength).toBeLessThan(25 * 1024 * 1024);
  });

  it("exports and verifies a thousand-chapter project archive under the instrumented budget", () => {
    const archive = projectArchiveFixture();
    archive.collections.chapters = Array.from({ length: 1_000 }, (_, index) => ({ id: `${index.toString(16).padStart(8, "0")}-0000-4000-a000-000000000002`, projectId: archive.project.id, sequenceIndex: index, title: `Chapter ${index + 1}`, bodyText: `Portable manuscript body ${index + 1}.`, bodyDocument: { type: "doc", content: [] }, wordCount: 4, version: 1 }));
    archive.manuscriptMarkdown = archive.collections.chapters.map((chapter) => `# ${chapter.title}\n\n${chapter.bodyText}`).join("\n\n");
    const started = performance.now(); const result = buildManifest(archive); const decoded = verifyArchive(result.bytes, result.manifest); const duration = performance.now() - started;
    expect(result.manifest.collectionCounts.chapters).toBe(1_000); expect(decoded.collections.chapters.at(-1)?.sequenceIndex).toBe(999); expect(duration).toBeLessThan(5_000); expect(result.bytes.byteLength).toBeLessThan(25 * 1024 * 1024);
  });
});
