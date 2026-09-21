type ClientTraceValue = string | number | boolean | null;
const forbiddenClientTraceKey = /(body|text|prose|content|document|capture|note|manuscript|selection|secret|signature|token)/i;

export function clientTrace(event: string, metadata: Readonly<Record<string, ClientTraceValue>>): void {
  const unsafeKey = Object.keys(metadata).find((key) => forbiddenClientTraceKey.test(key));
  if (unsafeKey) throw new Error(`Unsafe client trace metadata key rejected: ${unsafeKey}`);
  // Console trace S14-UI-000: single client trace transport emits content-safe interaction metadata only.
  console.log(JSON.stringify({ level: "info", event, timestamp: new Date().toISOString(), ...metadata }));
}
