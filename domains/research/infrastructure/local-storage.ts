import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PrivateObjectStorage } from "@/lib/storage/object-storage";
import type { MalwareScanner } from "../application/ports";

function safePath(root: string, key: string): string { const target = path.resolve(root, ...key.split("/").filter(Boolean)); const resolvedRoot = path.resolve(root); if (!target.startsWith(`${resolvedRoot}${path.sep}`)) throw new Error("Invalid private storage key."); return target; }
export class FilesystemPrivateObjectStorage implements PrivateObjectStorage {
  constructor(private readonly root: string) {}
  async putPrivate(input: { key: string; bytes: Uint8Array }): Promise<void> { const target = safePath(this.root, input.key); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, input.bytes, { flag: "wx" }); }
  async createSignedDownloadUrl(): Promise<URL> { throw new Error("Signed downloads are issued by the authenticated Mythra route, not by the filesystem adapter."); }
  async getPrivate(key: string): Promise<Uint8Array> { return new Uint8Array(await readFile(safePath(this.root, key))); }
  async deletePrivate(key: string): Promise<void> { await rm(safePath(this.root, key), { force: true }); }
}

export class DeterministicMalwareScanner implements MalwareScanner {
  async scan(input: { bytes: Uint8Array; contentType: string }): Promise<{ status: "CLEAN" | "INFECTED" | "ERROR"; reasonCode: string }> {
    const sample = new TextDecoder().decode(input.bytes.slice(0, 8_192));
    if (sample.includes("EICAR-STANDARD-ANTIVIRUS-TEST-FILE")) return { status: "INFECTED", reasonCode: "TEST_SIGNATURE" };
    const isPdf = input.contentType === "application/pdf"; if (isPdf && !sample.startsWith("%PDF-")) return { status: "ERROR", reasonCode: "MIME_SIGNATURE_MISMATCH" };
    return { status: "CLEAN", reasonCode: "LOCAL_DETERMINISTIC_PASS" };
  }
}

export class HttpMalwareScanner implements MalwareScanner {
  constructor(private readonly endpoint: string) {}
  async scan(input: { bytes: Uint8Array; contentType: string; sha256: string }): Promise<{ status: "CLEAN" | "INFECTED" | "ERROR"; reasonCode: string }> {
    const response = await fetch(this.endpoint, { method: "POST", headers: { "content-type": input.contentType, "x-content-sha256": input.sha256 }, body: input.bytes.slice().buffer as ArrayBuffer, signal: AbortSignal.timeout(30_000) });
    if (!response.ok) return { status: "ERROR", reasonCode: "SCANNER_HTTP_ERROR" };
    const payload = await response.json() as { status?: unknown; reasonCode?: unknown };
    if (!(["CLEAN", "INFECTED", "ERROR"] as const).includes(payload.status as "CLEAN" | "INFECTED" | "ERROR")) return { status: "ERROR", reasonCode: "SCANNER_INVALID_RESPONSE" };
    return { status: payload.status as "CLEAN" | "INFECTED" | "ERROR", reasonCode: typeof payload.reasonCode === "string" ? payload.reasonCode.slice(0, 160) : "SCANNER_RESULT" };
  }
}
