// @vitest-environment node
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import designBaseline from "../../docs/audits/phase-7x-foundation-baseline.json";
import {
  appearanceBaseline, assertBaselineScope, assertCurrentAppearanceScope, assertCosmeticCss, baselineAdditions,
  canonicalBytes, loadFoundation, readCurrentFoundation, sourceSignature, validateManifest,
  type FoundationManifest,
} from "../../scripts/verify-phase7x-appearance-scope";

let foundation: Map<string, Buffer>;
let current: Map<string, Buffer>;
let originalScope: Map<string, Buffer>;
let manifest: FoundationManifest;
beforeAll(async () => {
  foundation = await loadFoundation();
  manifest = JSON.parse(readFileSync("docs/audits/phase-7x-foundation-baseline.json", "utf8")) as FoundationManifest;
  current = readCurrentFoundation(foundation);
  originalScope = new Map(foundation);
  for (const path of baselineAdditions) originalScope.set(path, current.get(path)!);
});

describe("7X-0 pinned foundation and integration parity", () => {
  it("validates every independently archived file, AST, import and control-order fingerprint", () => {
    expect(appearanceBaseline).toBe("fd60f7f0035cc9cf49ab50264941d0fbdc36a846");
    expect(foundation.size).toBe(665); expect(manifest.routes).toHaveLength(16);
    validateManifest(manifest, foundation); assertBaselineScope(foundation, originalScope);
    assertCurrentAppearanceScope(foundation, current);
  });
  it("permits only the six documented additive baseline files", () => {
    expect(baselineAdditions.size).toBe(6);
    for (const path of baselineAdditions) expect(foundation.has(path)).toBe(false);
  });
  it.each([
    "app/layout.tsx", "components/shell/ThemeMenu.tsx", "lib/i18n/messages.ts", "lib/i18n/product-messages.ts",
    "app/globals.css", "components/editor/ChapterEditor.tsx", "components/shell/AppShell.tsx", "components/shell/CommandPalette.tsx",
    "lib/commands/registry.ts", "lib/theming/theme.ts", "components/theming/ThemeProvider.tsx", "lib/editor/use-modal-keyboard.ts",
    "domains/writing/domain/chapter-document.ts", "prisma/schema.prisma", "proxy.ts", "package.json", "package-lock.json",
    "playwright.config.ts", "vitest.config.ts", ".github/workflows/ci.yml", "scripts/verify-phase7-release-seal.ts",
    "tests/unit/command-reliability-boundary.test.ts", "tests/e2e/command-palette.spec.ts", "WorkPlan.md",
  ])("rejects synthetic changes to a protected file: %s", (path) => {
    expect(foundation.has(path)).toBe(true);
    const changed = new Map(originalScope); changed.set(path, Buffer.concat([foundation.get(path)!, Buffer.from("\n/* synthetic violation */\n")]));
    expect(() => assertBaselineScope(foundation, changed)).toThrow(`Frozen foundation changed: ${path}`);
  });
  it("rejects deletion, including a formerly permitted integration file", () => {
    const changed = new Map(originalScope); changed.delete("components/shell/ThemeMenu.tsx");
    expect(() => assertBaselineScope(foundation, changed)).toThrow("Foundation file deleted or moved");
  });
  it("rejects a rename rather than treating it as a cosmetic addition", () => {
    const changed = new Map(originalScope); changed.set("components/shell/RenamedThemeMenu.tsx", changed.get("components/shell/ThemeMenu.tsx")!);
    changed.delete("components/shell/ThemeMenu.tsx"); expect(() => assertBaselineScope(foundation, changed)).toThrow("deleted or moved");
  });
  it.each(["app/appearance.css", "lib/theming/appearance.ts", "app/new-route/page.tsx", "docs/unknown.md"])("rejects out-of-gate or unlisted additions: %s", (path) => {
    const changed = new Map(originalScope); changed.set(path, Buffer.from("synthetic"));
    expect(() => assertBaselineScope(foundation, changed)).toThrow("Unlisted gate-0 addition");
  });
  it("preserves historical Path except the two declared current dashboard rows", () => {
    const changed = new Map(originalScope); changed.set("Path.md", Buffer.from(foundation.get("Path.md")!.toString().replace("## 33.", "## 999.")));
    expect(() => assertBaselineScope(foundation, changed)).toThrow("Execution history rewritten");
  });
  it.each(["baselineCommit", "gate", "schemaVersion"] as const)("rejects a repinned manifest policy: %s", (key) => {
    expect(() => validateManifest({ ...manifest, [key]: key === "schemaVersion" ? 2 : "unknown" }, foundation)).toThrow("Invalid pinned");
  });
  it("rejects an omitted manifest path", () => {
    expect(() => validateManifest({ ...manifest, files: manifest.files.slice(1) }, foundation)).toThrow("Invalid pinned");
  });
  it("rejects duplicate paths and self-updated fingerprints", () => {
    const files = [...manifest.files]; files[1] = files[0]!;
    expect(() => validateManifest({ ...manifest, files }, foundation)).toThrow("Duplicate or omitted");
    const modified = manifest.files.map((row, index) => index === 0 ? { ...row, sha256: "0".repeat(64) } : row);
    expect(() => validateManifest({ ...manifest, files: modified }, foundation)).toThrow("Invalid foundation fingerprint");
  });
  it("rejects changed route inventories even when all files remain listed", () => {
    expect(() => validateManifest({ ...manifest, routes: [...manifest.routes, "/fake"] }, foundation)).toThrow("Route inventory changed");
  });
  it("rejects AST/import/control snapshot tampering", () => {
    for (const field of ["astSha256", "importSha256", "controlOrderSha256"] as const) {
      const files = manifest.files.map((row) => row.path === "components/shell/ThemeMenu.tsx" ? { ...row, [field]: "0".repeat(64) } : row);
      expect(() => validateManifest({ ...manifest, files }, foundation)).toThrow("Invalid source contract");
    }
  });
  it("distinguishes changed base-select handlers and added provider wrapping structurally", () => {
    const menu = foundation.get("components/shell/ThemeMenu.tsx")!;
    expect(sourceSignature("components/shell/ThemeMenu.tsx", Buffer.from(menu.toString().replace("setTheme(event.target.value as Theme)", "setTheme('light')"))).astSha256)
      .not.toBe(sourceSignature("components/shell/ThemeMenu.tsx", menu).astSha256);
    const layout = foundation.get("app/layout.tsx")!;
    expect(sourceSignature("app/layout.tsx", Buffer.from(layout.toString().replace("<ThemeProvider>{children}</ThemeProvider>", "<div>{children}</div>"))).astSha256)
      .not.toBe(sourceSignature("app/layout.tsx", layout).astSha256);
  });
  it("normalizes only Git text line endings and retains invalid UTF-8 and binary bytes", () => {
    expect(canonicalBytes(Buffer.from("a\r\nb\r\n"))).toEqual(Buffer.from("a\nb\n"));
    for (const bytes of [Buffer.from([0, 13, 10, 255]), Buffer.from([255, 13, 10])]) expect(canonicalBytes(bytes)).toEqual(bytes);
  });
});

describe("7X cosmetic CSS negative contract before styling", () => {
  it("accepts only finite color/finish declarations and accessibility media conditions", () => {
    assertCosmeticCss(':root[data-appearance-palette="aubergine"] { --bg: #17121b; --accent: #d5dc8c; } .command-dialog { background: var(--surface); border-color: var(--border); box-shadow: 0 1px 8px #0002; } @media (prefers-reduced-motion: reduce) { button { transition-duration: 0ms; } } @media (forced-colors: active) { button { outline-color: Highlight; } }');
  });
  it.each(["display", "visibility", "order", "grid-template", "grid-template-columns", "flex-direction", "gap", "width", "height", "min-width", "max-height", "padding", "margin", "position", "inset", "z-index", "overflow", "overscroll-behavior", "pointer-events", "content", "opacity", "transform", "font-size", "line-height", "--editor-font", "--font-ui"])("rejects layout/behavior/manuscript property: %s", (property) => {
    expect(() => assertCosmeticCss(`.app-shell { ${property}: 0; }`)).toThrow("Non-cosmetic appearance declaration");
  });
  it("rejects CSS-escaped forbidden properties and hidden nested declarations", () => {
    expect(() => assertCosmeticCss(String.raw`.app-shell { d\69 splay: none; }`)).toThrow("Non-cosmetic");
    expect(() => assertCosmeticCss(".app-shell { button { width: 0; } }")).toThrow("Non-cosmetic");
  });
  it.each(["@import 'https://example.test/style.css';", "@media (max-width: 767px) { button { color: red; } }", "@keyframes fade { to { color: red; } }"])("rejects new requests, breakpoints and animation queues", (css) => {
    expect(() => assertCosmeticCss(css)).toThrow("Unapproved appearance at-rule");
  });
  it("rejects external asset loads, functional priority overrides and malformed CSS", () => {
    expect(() => assertCosmeticCss("button { background-image: url(https://example.test/a.png); }")).toThrow("Non-cosmetic");
    expect(() => assertCosmeticCss("button { color: red !important; }")).toThrow("Non-cosmetic");
    expect(() => assertCosmeticCss("button {")).toThrow();
  });
  it.each([".editor-canvas", ".editor-prose", ".tiptap", ".ProseMirror", '[aria-label="Chapter manuscript"]', "[data-block-id]"])("rejects manuscript typography changes: %s", (selector) => {
    expect(() => assertCosmeticCss(`${selector} { font-family: sans-serif; }`)).toThrow("Manuscript typography is frozen");
  });
  it.each(["font-family", "font-weight", "letter-spacing"])("rejects inherited, nested and UI typography until finite-selector proof: %s", (property) => {
    for (const selector of [":root", "body", ".app-shell", ".command-bar", ".editor-layout > div"]) {
      expect(() => assertCosmeticCss(`${selector} { ${property}: inherit; }`)).toThrow("Manuscript typography is frozen");
      expect(() => assertCosmeticCss(`.app-shell { ${selector} { ${property}: inherit; } }`)).toThrow("Manuscript typography is frozen");
    }
  });
  it.each(["all 140ms", "transform 140ms", "opacity 140ms", "height 140ms"])("rejects non-cosmetic transition: %s", (value) => {
    expect(() => assertCosmeticCss(`button { transition: ${value}; }`)).toThrow("Non-cosmetic or concealing transition");
  });
  it.each(["color 181ms", "box-shadow 2s", "color 0.5s"])("rejects long or delayed transitions: %s", (value) => {
    expect(() => assertCosmeticCss(`button { transition: ${value}; }`)).toThrow("bounded motion budget");
  });
  it("stress-checks 1,000 accepted/forbidden audit inputs without product state or retained parser nodes", () => {
    for (let index = 0; index < 1000; index++) {
      expect(assertCosmeticCss(`.command-dialog { color: #${index.toString(16).padStart(6, "0")}; border-color: var(--border); }`)).toBeUndefined();
      expect(() => assertCosmeticCss(`.command-dialog { width: ${index}px; }`)).toThrow("Non-cosmetic appearance declaration");
    }
  });
});

describe("7X-0 candidate hexadecimal contract, not shipped appearance acceptance", () => {
  function luminance(hex: string) {
    const rgb = hex.slice(1).match(/../gu)!.map((value) => parseInt(value, 16) / 255)
      .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722;
  }
  const contrast = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
  it("declares exactly five palettes, six independent accents and three base-mode adaptations", () => {
    expect(designBaseline.appearanceContract.palettes.map((palette) => palette.key)).toEqual(["aubergine", "warm-ink", "forest", "burgundy", "neutral"]);
    expect(designBaseline.appearanceContract.accents.map((accent) => accent.key)).toEqual(["citron", "copper", "mint", "rose", "iris", "ice"]);
    expect(designBaseline.appearanceContract.storage).toEqual({ key: "mythra.appearance.v1", version: 1, maxBytes: 256, localOnly: true, defaultPalette: "aubergine", defaultAccent: "citron" });
  });
  it.each(designBaseline.appearanceContract.palettes.flatMap((palette) => designBaseline.appearanceContract.accents.flatMap((accent) =>
    (["light", "dark", "cream"] as const).map((mode) => ({ palette, accent, mode, name: `${palette.key}/${accent.key}/${mode}` })))))("checks candidate opaque roles for $name", ({ palette, accent, mode }) => {
    const tokens = palette.modes[mode]; const action = accent.modes[mode];
    for (const color of [...Object.values(tokens), ...Object.values(action)]) expect(color).toMatch(/^#[0-9a-f]{6}$/u);
    for (const background of [tokens.background, tokens.surface, tokens.raised, tokens.subdued]) {
      for (const foreground of [tokens.text, tokens.muted, action.accent]) expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(tokens.emphasizedBorder, background)).toBeGreaterThanOrEqual(3);
    }
    expect(contrast(action.onAction, action.action)).toBeGreaterThanOrEqual(4.5);
  });
});
