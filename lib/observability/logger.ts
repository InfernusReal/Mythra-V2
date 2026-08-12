type SafeLogValue = string | number | boolean | null | undefined;
export type SafeLogMetadata = Readonly<Record<string, SafeLogValue>>;

const forbiddenKeyPattern = /(body|text|prose|content|document|capture|note|manuscript|selection)/i;
type LogLevel = "debug" | "info" | "warn" | "error";

function assertContentSafe(metadata: SafeLogMetadata): void {
  const unsafeKey = Object.keys(metadata).find((key) => forbiddenKeyPattern.test(key));
  if (unsafeKey) throw new Error(`Unsafe log metadata key rejected: ${unsafeKey}`);
}

function writeStructuredConsole(level: LogLevel, event: string, metadata: SafeLogMetadata): void {
  assertContentSafe(metadata);
  const record = { level, event, timestamp: new Date().toISOString(), ...metadata };
  // Console trace S0-LOG-001: single structured console transport; metadata is content-safe by construction.
  console.log(JSON.stringify(record));
}

export interface Logger {
  debug(event: string, metadata?: SafeLogMetadata): void;
  info(event: string, metadata?: SafeLogMetadata): void;
  warn(event: string, metadata?: SafeLogMetadata): void;
  error(event: string, metadata?: SafeLogMetadata): void;
  child(base: SafeLogMetadata): Logger;
}

export function createLogger(base: SafeLogMetadata = {}): Logger {
  assertContentSafe(base);
  const emit = (level: LogLevel, event: string, metadata: SafeLogMetadata = {}) =>
    writeStructuredConsole(level, event, { ...base, ...metadata });
  return {
    debug: (event, metadata) => emit("debug", event, metadata),
    info: (event, metadata) => emit("info", event, metadata),
    warn: (event, metadata) => emit("warn", event, metadata),
    error: (event, metadata) => emit("error", event, metadata),
    child: (childBase) => createLogger({ ...base, ...childBase })
  };
}

export const logger = createLogger({ service: "mythra-web" });
