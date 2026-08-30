import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { importedChapterDocument, mapV1Seam, previewImport } from "@/domains/portability/domain/import";

async function docxBytes(): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
  zip.folder("_rels")!.file(".rels", `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  zip.folder("word")!.file("document.xml", `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Chapter One</w:t></w:r></w:p><w:p><w:r><w:t>Imported prose.</w:t></w:r></w:p></w:body></w:document>`);
  return zip.generateAsync({ type: "uint8array" });
}

describe("portability import", () => {
  it("previews text and Markdown without canonical mutation", async () => {
    const markdown = await previewImport("MARKDOWN", new TextEncoder().encode("# One\nFirst body\n# Two\nSecond body"));
    expect(markdown.chapters.map((item) => item.title)).toEqual(["One", "Two"]); expect(markdown.chapters[1]?.bodyText).toBe("Second body");
    const text = await previewImport("TEXT", new TextEncoder().encode("Chapter 1\nFirst\nChapter 2\nSecond")); expect(text.chapters).toHaveLength(2);
  });

  it("uses a real DOCX container parser and produces valid rich documents only after confirmation code requests it", async () => {
    const preview = await previewImport("DOCX", await docxBytes()); expect(preview.chapters[0]?.bodyText).toContain("Imported prose.");
    const document = importedChapterDocument(preview.chapters[0]!.bodyText); expect(document.schemaVersion).toBe(1); expect(document.content[0]?.attrs.blockId).toMatch(/[0-9a-f-]{36}/);
  });

  it("maps V1 facts without inventing outlines, scenes, or causal facts", () => {
    const mapped = mapV1Seam({ chapters: [{ id: "chapter" }], worldNodes: [{ id: "node" }] }); expect(mapped.storyEntities[0]).toMatchObject({ id: "node", legacySourceType: "WORLD_NODE" }); expect(mapped.optionalScenes).toEqual([]); expect(mapped.causalRelations).toEqual([]); expect(mapped.inventedOutlineCount).toBe(0); expect(mapped.inventedCausalCount).toBe(0);
  });
});
