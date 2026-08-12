import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DebouncedDraftJournal, deleteDraftJournal, readDraftJournal, writeDraftJournal, type DraftJournalRecord } from "@/lib/indexed-db/draft-journal";
import { emptyChapterDocument } from "@/domains/writing/domain/chapter-document";

const record: DraftJournalRecord = {
  chapterId: "2451738e-f4cf-49d9-934d-b6d87b3f5c9d",
  document: emptyChapterDocument(),
  baseVersion: 1,
  clientSaveId: null,
  state: "DIRTY_LOCAL",
  updatedAt: 1,
  selectionAnchor: 0,
  scrollTop: 0
};

describe("IndexedDB chapter journal", () => {
  beforeEach(async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    await deleteDraftJournal(record.chapterId);
  });

  it("round-trips a versioned structured document and clears only after acknowledgement", async () => {
    await writeDraftJournal(record);
    await expect(readDraftJournal(record.chapterId)).resolves.toEqual(record);
    await deleteDraftJournal(record.chapterId);
    await expect(readDraftJournal(record.chapterId)).resolves.toBeNull();
  });

  it("debounces repeated local edits to the latest record", async () => {
    const journal = new DebouncedDraftJournal(5);
    journal.schedule({ ...record, updatedAt: 2 });
    journal.schedule({ ...record, updatedAt: 3, state: "OFFLINE_DIRTY" });
    await journal.flush();
    await expect(readDraftJournal(record.chapterId)).resolves.toMatchObject({ updatedAt: 3, state: "OFFLINE_DIRTY" });
  });

  it("bounds retained chapter journals to the 100 most recent", async () => {
    for (let index = 0; index < 101; index += 1) {
      await writeDraftJournal({ ...record, chapterId: `chapter-${index}`, updatedAt: index });
    }
    await expect(readDraftJournal("chapter-0")).resolves.toBeNull();
    await expect(readDraftJournal("chapter-100")).resolves.toMatchObject({ updatedAt: 100 });
  });
});
