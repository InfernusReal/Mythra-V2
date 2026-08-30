import { randomUUID } from "node:crypto";
import mammoth from "mammoth";
import type { ChapterDocument } from "@/domains/writing/domain/chapter-document";

export type SupportedImportFormat = "TEXT" | "MARKDOWN" | "DOCX";
export interface ImportChapterPreview { title: string; bodyText: string; wordCount: number }
export interface ImportPreview { format: SupportedImportFormat; chapters: ImportChapterPreview[]; warningCodes: string[] }

const MAX_IMPORT_BYTES = 25 * 1024 * 1024;
const MAX_CHAPTERS = 2_000;

function splitText(text: string, format: SupportedImportFormat): ImportChapterPreview[] {
  const normalized = text.replace(/\r\n?/g, "\n").replace(/\u0000/g, "").trim();
  if (!normalized) return [];
  const heading = format === "MARKDOWN" ? /^#{1,2}\s+(.+)$/gm : /^(?:chapter|part)\s+([\w.-]+.*)$/gim;
  const matches = [...normalized.matchAll(heading)];
  if (!matches.length) return [{ title: "Imported chapter", bodyText: normalized, wordCount: normalized.split(/\s+/u).length }];
  const chapters: ImportChapterPreview[] = [];
  const prefix = normalized.slice(0, matches[0]!.index).trim();
  if (prefix) chapters.push({ title: "Imported preface", bodyText: prefix, wordCount: prefix.split(/\s+/u).length });
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index]!;
    const next = matches[index + 1];
    const body = normalized.slice((match.index ?? 0) + match[0].length, next?.index ?? normalized.length).trim();
    const title = (match[1] || match[0]).replace(/^#+\s*/, "").trim().slice(0, 240);
    chapters.push({ title: title || `Imported chapter ${index + 1}`, bodyText: body, wordCount: body ? body.split(/\s+/u).length : 0 });
  }
  return chapters.slice(0, MAX_CHAPTERS);
}

export async function previewImport(format: SupportedImportFormat, bytes: Uint8Array): Promise<ImportPreview> {
  if (!bytes.byteLength || bytes.byteLength > MAX_IMPORT_BYTES) throw new Error("IMPORT_SIZE_INVALID");
  const text = format === "DOCX" ? (await mammoth.extractRawText({ buffer: Buffer.from(bytes) })).value : new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const splitFormat = format === "DOCX" ? "TEXT" : format;
  const chapters = splitText(text, splitFormat);
  if (!chapters.length) throw new Error("IMPORT_EMPTY");
  return { format, chapters, warningCodes: chapters.length === MAX_CHAPTERS ? ["CHAPTER_PREVIEW_CAPPED"] : [] };
}

export function importedChapterDocument(bodyText: string): ChapterDocument {
  const paragraphs = bodyText.split(/\n{2,}/u).map((text) => text.trim()).filter(Boolean).slice(0, 20_000);
  return { schemaVersion: 1, type: "doc", content: (paragraphs.length ? paragraphs : [""]).map((text) => ({ type: "paragraph", attrs: { blockId: randomUUID() }, ...(text ? { content: [{ type: "text", text }] } : {}) })) };
}

export interface V1Archive { chapters?: JsonRecord[]; worldNodes?: JsonRecord[]; scenes?: JsonRecord[]; causalRelations?: JsonRecord[] }
type JsonRecord = Record<string, unknown>;

export function mapV1Seam(input: V1Archive): { chapters: JsonRecord[]; storyEntities: JsonRecord[]; optionalScenes: JsonRecord[]; causalRelations: JsonRecord[]; inventedOutlineCount: 0; inventedCausalCount: 0 } {
  return { chapters: input.chapters ?? [], storyEntities: (input.worldNodes ?? []).map((node) => ({ ...node, legacySourceType: "WORLD_NODE" })), optionalScenes: input.scenes ?? [], causalRelations: input.causalRelations ?? [], inventedOutlineCount: 0, inventedCausalCount: 0 };
}
