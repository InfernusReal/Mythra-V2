import type { ChapterDocument } from "@/domains/writing/domain/chapter-document";

const DATABASE_NAME = "mythra-drafts";
const STORE_NAME = "chapter-journals";
const DATABASE_VERSION = 1;
const MAX_JOURNALED_CHAPTERS = 100;

export interface DraftJournalRecord {
  chapterId: string;
  document: ChapterDocument;
  baseVersion: number;
  clientSaveId: string | null;
  state: "DIRTY_LOCAL" | "SAVING" | "OFFLINE_DIRTY" | "CONFLICT" | "RECOVERABLE_LOCAL";
  updatedAt: number;
  selectionAnchor: number | null;
  scrollTop: number | null;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: "chapterId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Draft journal database could not be opened."));
  });
}

async function transact<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void): Promise<T> {
  const database = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error ?? new Error("Draft journal transaction failed."));
    operation(transaction.objectStore(STORE_NAME), resolve, reject);
  });
}

export async function readDraftJournal(chapterId: string): Promise<DraftJournalRecord | null> {
  const record = await transact<DraftJournalRecord | null>("readonly", (store, resolve, reject) => {
    const request = store.get(chapterId);
    request.onsuccess = () => resolve((request.result as DraftJournalRecord | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
  // Console trace S2-JOURNAL-002: journal recovery lookup completed; document content is excluded.
  console.log(JSON.stringify({ level: "info", step: "S2-JOURNAL-002", event: "draft_journal.read", chapterId, found: Boolean(record), state: record?.state, baseVersion: record?.baseVersion }));
  return record;
}

export async function writeDraftJournal(record: DraftJournalRecord): Promise<void> {
  await transact<void>("readwrite", (store, resolve, reject) => {
    const request = store.put(record);
    request.onsuccess = () => {
      const all = store.getAll();
      all.onsuccess = () => {
        const records = (all.result as DraftJournalRecord[]).sort((left, right) => right.updatedAt - left.updatedAt);
        for (const stale of records.slice(MAX_JOURNALED_CHAPTERS)) store.delete(stale.chapterId);
        resolve();
      };
      all.onerror = () => reject(all.error);
    };
    request.onerror = () => reject(request.error);
  });
  // Console trace S2-JOURNAL-001: local draft journal persisted; only state/version metadata is emitted.
  console.log(JSON.stringify({ level: "info", step: "S2-JOURNAL-001", event: "draft_journal.written", chapterId: record.chapterId, state: record.state, baseVersion: record.baseVersion, hasPendingSave: Boolean(record.clientSaveId) }));
}

export async function deleteDraftJournal(chapterId: string): Promise<void> {
  await transact<void>("readwrite", (store, resolve, reject) => {
    const request = store.delete(chapterId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  // Console trace S2-JOURNAL-003: acknowledged journal removed; no document content is emitted.
  console.log(JSON.stringify({ level: "info", step: "S2-JOURNAL-003", event: "draft_journal.cleared", chapterId }));
}

export class DebouncedDraftJournal {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pending: DraftJournalRecord | null = null;

  constructor(private readonly delayMs = 75) {}

  schedule(record: DraftJournalRecord): void {
    this.pending = record;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { void this.flush(); }, this.delayMs);
  }

  async flush(): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const record = this.pending;
    this.pending = null;
    if (record) await writeDraftJournal(record);
  }
}
