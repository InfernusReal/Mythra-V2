const forbiddenKey = /(body|prose|content|document|manuscript|selection|selected|capture|note|query|result|filename|displayname|payload|secret|token|signedurl|authorization|cookie|message|title|description|url)/iu;
const secretShape = /(bearer\s+|-----begin\s+|(?:https?|file):\/\/|[?&](access|token|signature)=)/iu;

export type SafeOperationalScalar = string | number | boolean | null;
export type SafeOperationalRecord = Readonly<Record<string, SafeOperationalScalar>>;

export function assertContentSafeKey(key: string): void {
  const identifierOrAggregate = /(Id|Count|Length|Status|Type|Version|Available|Requested|Digest|Hash|Sha256)$/u.test(key) || /^(has|is)[A-Z]/u.test(key);
  if (!/^[a-z][a-zA-Z0-9]{0,63}$/u.test(key) || (forbiddenKey.test(key) && !identifierOrAggregate)) {
    throw new Error(`Unsafe telemetry key rejected: ${key}`);
  }
}

export function assertContentSafeValue(value: SafeOperationalScalar): void {
  if (typeof value === "number" && !Number.isFinite(value)) throw new Error("Telemetry numbers must be finite.");
  if (typeof value !== "string") return;
  if (value.length > 160 || /[\r\n]/u.test(value) || secretShape.test(value)) {
    throw new Error("Unsafe telemetry value rejected.");
  }
}

export function assertContentSafeRecord(record: Readonly<Record<string, unknown>>, depth = 0): void {
  if (depth > 4 || Object.keys(record).length > 64) throw new Error("Telemetry metadata bounds exceeded.");
  for (const [key, value] of Object.entries(record)) {
    assertContentSafeKey(key);
    if (value === undefined) continue;
    if (value !== null && typeof value === "object") {
      if (Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new Error("Unsafe nested telemetry value rejected.");
      assertContentSafeRecord(value as Readonly<Record<string, unknown>>, depth + 1);
      continue;
    }
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean" && value !== null) throw new Error("Unsafe telemetry value rejected.");
    assertContentSafeValue(value);
  }
}
