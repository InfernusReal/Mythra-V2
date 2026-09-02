import { errors } from "@/lib/contracts/errors";

const signatures: Readonly<Record<string, readonly number[] | "TEXT">> = Object.freeze({
  "application/pdf": [0x25, 0x50, 0x44, 0x46, 0x2d],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "text/plain": "TEXT",
  "text/markdown": "TEXT"
});

function isText(bytes: Uint8Array): boolean {
  const sample = bytes.slice(0, 8_192);
  return !sample.includes(0) && new TextDecoder("utf-8", { fatal: true }).decode(sample).length >= 0;
}

export function assertUploadSignature(contentType: string, bytes: Uint8Array): void {
  const expected = signatures[contentType];
  if (!expected) throw errors.validation("This file type is not supported.");
  const matches = expected === "TEXT" ? isText(bytes) : expected.every((byte, index) => bytes[index] === byte);
  if (!matches) throw errors.validation("The file signature does not match its declared type.");
}

export function assertCleanScan(status: "CLEAN" | "INFECTED" | "ERROR"): void {
  if (status !== "CLEAN") throw errors.dependencyUnavailable();
}
