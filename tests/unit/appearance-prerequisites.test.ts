// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import baseline from "../../docs/audits/phase-7x-foundation-baseline.json";
import {
  assertBaselineScope, assertCurrentAppearanceScope, canonicalBytes, expectedPrerequisiteFoundation,
  loadFoundation, prerequisiteAdditions, prerequisiteRevisions, captureRepairAdditions, captureRepairRevisions, readCurrentFoundation, sourceSignature,
} from "../../scripts/verify-phase7x-appearance-scope";
import { expectedShellBackground, fallbackBodyColors, type ResolvedShellTheme } from "../fixtures/shell-appearance-contract";

let foundation: Map<string, Buffer>;
let current: Map<string, Buffer>;
beforeAll(async () => { foundation = await loadFoundation(); current = readCurrentFoundation(foundation); });

describe("separately authorized finite prerequisites, not gate-1 integration", () => {
  it("audits every current path against immutable foundation plus exact reviewed revisions", () => {
    assertCurrentAppearanceScope(foundation, current);
    expect(Object.keys(prerequisiteRevisions)).toHaveLength(3);
    expect(prerequisiteAdditions.size).toBe(4);
    expect(Object.keys(captureRepairRevisions)).toHaveLength(1);
    expect(captureRepairAdditions.size).toBe(2);
  });
  it("retains the old strict checker which rejects the semantic revision", () => {
    expect(() => assertBaselineScope(foundation, current)).toThrow("Frozen foundation changed");
  });
  it("matches the original canonical-byte algorithm for every archived file and line-ending/binary cases", () => {
    const originalCanonical = (bytes: Buffer) => {
      const text = bytes.toString("utf8");
      return bytes.includes(0) || !Buffer.from(text, "utf8").equals(bytes)
        ? bytes : Buffer.from(text.replaceAll("\r\n", "\n"), "utf8");
    };
    for (const bytes of [...foundation.values(), Buffer.from(""), Buffer.from("Unicode café\r\nline\r"), Buffer.from([0, 13, 10, 255]), Buffer.from([255, 13, 10]), Buffer.from([255, 10])]) {
      expect(canonicalBytes(bytes).equals(originalCanonical(bytes))).toBe(true);
    }
    for (let index = 0; index < 1000; index++) {
      const bytes = Buffer.from(Array.from({ length: 24 }, (_, offset) => (index * 73 + offset * 31) % 256));
      if (index % 2 === 0) { bytes[4] = 13; bytes[5] = 10; }
      expect(canonicalBytes(bytes).equals(originalCanonical(bytes))).toBe(true);
    }
  });
  it.each(Object.keys(prerequisiteRevisions))("requires exact independent source recipe for %s", (path) => {
    expect(canonicalBytes(current.get(path)!)).toEqual(expectedPrerequisiteFoundation(foundation).get(path));
  });
  it.each(Object.keys(captureRepairRevisions))("requires exact separately authorized Capture recipe for %s", (path) => {
    expect(canonicalBytes(current.get(path)!)).toEqual(expectedPrerequisiteFoundation(foundation).get(path));
    const restored = canonicalBytes(current.get(path)!).toString().replace(captureRepairRevisions[path]![0]![1], captureRepairRevisions[path]![0]![0]);
    expect(Buffer.from(restored)).toEqual(foundation.get(path));
  });
  it.each(baseline.files.map((file) => file.path))("rejects any extra current foundation mutation: %s", (path) => {
    const changed = new Map(current);
    const bytes = changed.get(path)!;
    changed.set(path, path === "Path.md"
      ? Buffer.from(bytes.toString().replace("## 35.", "## 999."))
      : Buffer.concat([bytes, Buffer.from("\n/* synthetic extra revision */\n")]));
    expect(() => assertCurrentAppearanceScope(foundation, changed)).toThrow(path === "Path.md" ? "Execution history rewritten" : `Frozen foundation changed: ${path}`);
  });
  it.each([...prerequisiteAdditions, ...captureRepairAdditions])("requires authorized supporting test %s", (path) => {
    const changed = new Map(current); changed.delete(path);
    expect(() => assertCurrentAppearanceScope(foundation, changed)).toThrow(`Required prerequisite test absent: ${path}`);
  });
  it.each(["app/appearance.css", "lib/theming/appearance.ts", "tests/unit/unlisted-proof.test.ts"])("rejects premature or unlisted addition %s", (path) => {
    const changed = new Map(current); changed.set(path, Buffer.from("synthetic"));
    expect(() => assertCurrentAppearanceScope(foundation, changed)).toThrow("Unlisted gate-0 addition");
  });
  it("rejects protected deletions and renames in the current tree", () => {
    const changed = new Map(current); const path = "components/shell/ThemeMenu.tsx";
    changed.set("components/shell/RenamedThemeMenu.tsx", changed.get(path)!); changed.delete(path);
    expect(() => assertCurrentAppearanceScope(foundation, changed)).toThrow(`Foundation file deleted or moved: ${path}`);
  });
  it.each(["## 34.", "### 35.1", "### 35.2", "### 35.3", "### 35.4", "### 35.5", "### 35.6", "### 35.7", "### 35.8", "### 35.9", "### 36.1"])("preserves the entire published execution history including %s", (anchor) => {
    const changed = new Map(current); const ledger = changed.get("Path.md")!.toString();
    expect(ledger).toContain(anchor);
    changed.set("Path.md", Buffer.from(ledger.replace(anchor, `${anchor} altered`)));
    expect(() => assertCurrentAppearanceScope(foundation, changed)).toThrow("Execution history rewritten");
  });
  it("fails closed if the independent baseline has missing or ambiguous revision anchors", () => {
    const changed = new Map(foundation); const path = "components/shell/CommandPalette.tsx";
    changed.delete(path); expect(() => expectedPrerequisiteFoundation(changed)).toThrow("Prerequisite baseline absent");
    changed.set(path, Buffer.concat([foundation.get(path)!, foundation.get(path)!]));
    expect(() => expectedPrerequisiteFoundation(changed)).toThrow("Prerequisite anchor count differs");
  });
  it("changes only the header role; restoring it recovers the complete original AST and controls", () => {
    const path = "components/shell/CommandPalette.tsx";
    const oldBytes = foundation.get(path)!; const newText = canonicalBytes(current.get(path)!).toString();
    expect(newText.split('<header role="none">')).toHaveLength(2);
    const restored = Buffer.from(newText.replace('<header role="none">', "<header>"));
    expect(restored).toEqual(oldBytes);
    expect(sourceSignature(path, restored)).toEqual(sourceSignature(path, oldBytes));
  });
  it.each(['role="banner"', 'role="none" onClick={() => closePalette()}', 'role="none" hidden'])("rejects other modal semantics, handlers or visibility: %s", (attributes) => {
    const changed = new Map(current); const path = "components/shell/CommandPalette.tsx";
    changed.set(path, Buffer.from(changed.get(path)!.toString().replace('role="none"', attributes)));
    expect(() => assertCurrentAppearanceScope(foundation, changed)).toThrow(`Frozen foundation changed: ${path}`);
  });
});

describe("independent exact fallback and finite current shell color contracts", () => {
  it("retains every original exact fallback RGB value without modifying the stylesheet", () => {
    expect(fallbackBodyColors).toEqual({ light: "rgb(250, 250, 249)", dark: "rgb(17, 18, 20)", cream: "rgb(245, 239, 227)" });
    for (const mode of ["light", "dark", "cream"] as const) expect(expectedShellBackground(mode, null, null)).toBe(fallbackBodyColors[mode]);
    expect(canonicalBytes(current.get("app/globals.css")!)).toEqual(foundation.get("app/globals.css"));
  });
  it.each(baseline.appearanceContract.palettes.flatMap((palette) => baseline.appearanceContract.accents.flatMap((accent) =>
    (["light", "dark", "cream"] as const).map((mode) => ({ palette, accent, mode, name: `${palette.key}/${accent.key}/${mode}` })))))("checks independently declared current background for $name", ({ palette, accent, mode }) => {
    const hex = palette.modes[mode].background;
    const rgb = [1, 3, 5].map((offset) => Number(`0x${hex.substring(offset, offset + 2)}`));
    expect(expectedShellBackground(mode, palette.key, accent.key)).toBe(`rgb(${rgb.join(", ")})`);
  });
  it.each([[null, "citron"], ["aubergine", null], ["unknown", "citron"], ["aubergine", "unknown"], ["Aubergine", "citron"], ["", ""]])("rejects unknown or partial current attributes %s/%s", (palette, accent) => {
    expect(() => expectedShellBackground("dark", palette, accent)).toThrow("Unknown or partial");
  });
  it.each(["system", "unknown", "Dark", "", null])("rejects unresolved or invalid theme %s", (mode) => {
    expect(() => expectedShellBackground(mode as ResolvedShellTheme, null, null)).toThrow("Unknown resolved");
  });
});
