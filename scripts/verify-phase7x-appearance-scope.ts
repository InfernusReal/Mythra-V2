import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import postcss from "postcss";
import ts from "typescript";

export const appearanceBaseline = "fd60f7f0035cc9cf49ab50264941d0fbdc36a846";
export const baselineAdditions = new Set([
  "docs/adr/0013-appearance-only-palettes.md",
  "docs/audits/phase-7x-foundation-baseline.json",
  "docs/audits/phase-7x-appearance-audit.md",
  "scripts/verify-phase7x-appearance-scope.ts",
  "tests/unit/appearance.test.ts",
  "tests/e2e/appearance-foundation-parity.spec.ts",
]);

export type FoundationFiles = ReadonlyMap<string, Buffer>;
export type FoundationRow = {
  path: string; sha256: string; bytes: number; binary: boolean;
  astSha256?: string; importCount?: number; importSha256?: string;
  controlCount?: number; controlOrderSha256?: string;
};
export type FoundationManifest = {
  schemaVersion: number; baselineCommit: string; gate: string;
  files: FoundationRow[]; routes: string[];
};

/** Git normalizes text checkout line endings; binary identity is never decoded lossily. */
export function canonicalBytes(bytes: Buffer): Buffer {
  const text = bytes.toString("utf8");
  return bytes.includes(0) || !Buffer.from(text, "utf8").equals(bytes)
    ? bytes : Buffer.from(text.replaceAll("\r\n", "\n"), "utf8");
}

const hash = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");

export function sourceSignature(path: string, bytes: Buffer): Partial<FoundationRow> {
  if (!/\.[cm]?[jt]sx?$/u.test(path)) return {};
  const ast = ts.createSourceFile(path, bytes.toString("utf8"), ts.ScriptTarget.Latest, true,
    path.endsWith(".tsx") ? ts.ScriptKind.TSX : undefined);
  const imports: string[] = []; const controls: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(ast);
      if (["button", "input", "select", "textarea", "a", "nav", "main", "aside", "header", "form"].includes(tag)) {
        controls.push(`${tag}:${node.attributes.getText(ast)}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return { astSha256: hash(ts.createPrinter({ removeComments: true }).printFile(ast)),
    importCount: imports.length, importSha256: hash(JSON.stringify(imports)),
    controlCount: controls.length, controlOrderSha256: hash(JSON.stringify(controls)) };
}

export async function loadFoundation(): Promise<Map<string, Buffer>> {
  const archive = await JSZip.loadAsync(execFileSync("git", ["archive", "--format=zip", appearanceBaseline], { maxBuffer: 64 * 1024 * 1024 }));
  const files = new Map<string, Buffer>();
  for (const [path, entry] of Object.entries(archive.files).sort(([a], [b]) => a.localeCompare(b, "en"))) {
    if (!entry.dir) files.set(path, canonicalBytes(await entry.async("nodebuffer")));
  }
  return files;
}

export function validateManifest(manifest: FoundationManifest, foundation: FoundationFiles): void {
  if (manifest.schemaVersion !== 1 || manifest.baselineCommit !== appearanceBaseline || manifest.gate !== "7X-0"
      || !Array.isArray(manifest.files) || manifest.files.length !== foundation.size || !Array.isArray(manifest.routes)) {
    throw new Error("Invalid pinned appearance baseline contract");
  }
  const rows = new Map(manifest.files.map((row) => [row.path, row]));
  if (rows.size !== foundation.size) throw new Error("Duplicate or omitted foundation path");
  for (const [path, bytes] of foundation) {
    const row = rows.get(path);
    const binary = bytes.includes(0) || !Buffer.from(bytes.toString("utf8")).equals(bytes);
    if (!row || row.sha256 !== hash(bytes) || row.bytes !== bytes.length || row.binary !== binary) {
      throw new Error(`Invalid foundation fingerprint: ${path}`);
    }
    const signature = sourceSignature(path, bytes);
    for (const key of ["astSha256", "importCount", "importSha256", "controlCount", "controlOrderSha256"] as const) {
      if (row[key] !== signature[key]) throw new Error(`Invalid source contract: ${path}`);
    }
  }
  const routes = [...foundation.keys()].filter((path) => path.endsWith("/page.tsx"))
    .map((path) => path.replace(/^app/u, "").replace(/\/page.tsx$/u, "") || "/");
  if (JSON.stringify(routes) !== JSON.stringify(manifest.routes)) throw new Error("Route inventory changed");
}

const ledgerHistory = (bytes: Buffer) => canonicalBytes(bytes).toString("utf8").split("\n")
  .filter((line) => !line.startsWith("| 7X. Appearance") && !line.startsWith("| 7X-0 |"))
  .join("\n").trimEnd();

/** Gate 0 permits no existing production integration, including the later gate's named hooks. */
export function assertBaselineScope(foundation: FoundationFiles, current: FoundationFiles): void {
  for (const [path, original] of foundation) {
    const value = current.get(path);
    if (!value) throw new Error(`Foundation file deleted or moved: ${path}`);
    if (path === "Path.md") {
      const history = ledgerHistory(original); const updated = ledgerHistory(value);
      if (updated !== history && !updated.startsWith(`${history}\n`)) throw new Error("Execution history rewritten");
    } else if (!canonicalBytes(value).equals(original)) {
      throw new Error(`Frozen foundation changed: ${path}`);
    }
  }
  for (const path of current.keys()) {
    if (!foundation.has(path) && !baselineAdditions.has(path)) throw new Error(`Unlisted gate-0 addition: ${path}`);
  }
}

const colorProperties = new Set([
  "color", "background", "background-color", "background-image", "border-color",
  "border-top-color", "border-bottom-color", "border-left-color", "border-right-color",
  "border-inline-color", "border-inline-start-color", "border-inline-end-color",
  "border-block-color", "border-block-start-color", "border-block-end-color",
  "border-radius", "border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius",
  "box-shadow", "outline-color", "text-decoration-color", "caret-color", "fill", "stroke", "stroke-width",
  "transition", "transition-property", "transition-duration", "transition-timing-function",
]);
const tokens = new Set(["--bg", "--surface", "--surface-raised", "--surface-soft", "--text", "--text-muted", "--border", "--border-strong",
  "--accent", "--accent-action", "--accent-soft", "--danger", "--success", "--focus", "--focus-halo", "--selection", "--shadow-soft", "--control-radius"]);
const decodeCss = (text: string) => text.replace(/\\([0-9a-f]{1,6})\s?|\\([^\r\n])/giu,
  (_, hex: string | undefined, literal: string | undefined) => hex ? String.fromCodePoint(parseInt(hex, 16)) : literal!);

/** Parse CSS rather than searching lines: escaped declarations and nested rules must also be audited. */
export function assertCosmeticCss(css: string): void {
  const root = postcss.parse(css);
  root.walkAtRules((rule) => {
    if (decodeCss(rule.name).toLowerCase() !== "media" || !/^(\(prefers-reduced-motion:\s*reduce\)|\(forced-colors:\s*active\))$/u.test(rule.params.trim())) {
      throw new Error("Unapproved appearance at-rule or breakpoint");
    }
  });
  root.walkDecls((decl) => {
    const property = decodeCss(decl.prop).toLowerCase(); const value = decodeCss(decl.value);
    if (["font-family", "font-weight", "letter-spacing"].includes(property)) {
      throw new Error("Manuscript typography is frozen; inherited and UI typography overrides require a later finite-selector proof");
    }
    if (!(colorProperties.has(property) || tokens.has(property)) || decl.important || /\b(url|expression)\s*\(/iu.test(value)) {
      throw new Error(`Non-cosmetic appearance declaration: ${property}`);
    }
    if (property.startsWith("transition") && /\b(all|transform|width|height|margin|padding|left|top|opacity)\b/iu.test(value)) {
      throw new Error("Non-cosmetic or concealing transition");
    }
    if (property.startsWith("transition") && [...value.matchAll(/(\d*\.?\d+)(ms|s)\b/gu)].some((match) => Number(match[1]) * (match[2] === "s" ? 1000 : 1) > 180)) {
      throw new Error("Appearance transition exceeds the bounded motion budget");
    }
  });
}

export async function verifyAppearanceBaseline() {
  // Console trace 7X-SCOPE-001: begin the read-only pinned foundation audit without runtime or author data.
  console.log(JSON.stringify({ level: "info", step: "7X-SCOPE-001", event: "appearance.scope_started", version: 1 }));
  const foundation = await loadFoundation();
  const manifest = JSON.parse(readFileSync("docs/audits/phase-7x-foundation-baseline.json", "utf8")) as FoundationManifest;
  validateManifest(manifest, foundation);
  // Console trace 7X-SCOPE-002: report validated source inventory counts only.
  console.log(JSON.stringify({ level: "info", step: "7X-SCOPE-002", event: "appearance.baseline_validated", fileCount: foundation.size, routeCount: manifest.routes.length }));
  const paths = new Set([...foundation.keys(), ...execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" }).trim().split("\n")]);
  const current = new Map<string, Buffer>();
  for (const path of paths) { try { current.set(path, readFileSync(path)); } catch { /* Missing files are rejected by the complete scope comparison. */ } }
  assertBaselineScope(foundation, current);
  // Console trace 7X-SCOPE-003: complete the no-product-mutation gate-0 scope proof with bounded counts.
  console.log(JSON.stringify({ level: "info", step: "7X-SCOPE-003", event: "appearance.scope_verified", frozenFileCount: foundation.size - 1, additiveFileCount: current.size - foundation.size, productChanged: false }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verifyAppearanceBaseline().catch(() => {
    // Console trace 7X-SCOPE-004: reject a failed scope check without source contents or raw exceptions.
    console.log(JSON.stringify({ level: "error", step: "7X-SCOPE-004", event: "appearance.scope_rejected", passed: false }));
    process.exitCode = 1;
  });
}
