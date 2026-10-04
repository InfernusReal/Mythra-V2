// @vitest-environment node
import { execFileSync } from "node:child_process";
import JSZip from "jszip";
import { assertCurrentAppearanceScope, loadFoundation, readCurrentFoundation } from "../../scripts/verify-phase7x-appearance-scope";
import { beforeAll, describe, expect, it } from "vitest";

const checkpoint = "50c93c4157892aa71dd0bf3184512656ea78b8a2";
const original = new Map<string, string>();
const acceptedRepair = new Map<string, string>();
const normalize = (value: string) => value.replaceAll("\r\n", "\n");
const fingerprint = (bytes: Buffer) => {
  const text = bytes.toString("utf8");
  return bytes.includes(0) || !Buffer.from(text, "utf8").equals(bytes) ? `binary:${bytes.toString("base64")}` : normalize(text);
};
const repairs: Record<string, readonly (readonly [string, string])[]> = {
  "app/layout.tsx": [
    ['import "./globals.css";', 'import { earlyCommandIntentScript } from "@/lib/commands/early-intent";\nimport "./globals.css";'],
    ['        <LocaleProvider locale={locale}>', '        <Script id="mythra-command-intent-bootstrap" strategy="beforeInteractive">\n          {earlyCommandIntentScript}\n        </Script>\n        <LocaleProvider locale={locale}>'],
  ],
  "components/editor/ChapterEditor.tsx": [
    ['import { Plugin, TextSelection } from "@tiptap/pm/state";', 'import { Plugin, TextSelection } from "@tiptap/pm/state";\nimport { captureWritingSelection } from "@/lib/editor/writing-selection";'],
    ['        const { anchor, head } = editor.state.selection;', '        const { anchor, head, source, engineBehind } = captureWritingSelection(editor);\n        // Console trace REL-FOCUS-001: command focus captures the latest valid coordinate source without prose or identifiers.\n        console.log(JSON.stringify({ level: "info", step: "REL-FOCUS-001", event: "command.writing_selection_captured", source, engineBehind }));'],
  ],
  "components/shell/CommandPalette.tsx": [
    ['  useEffect,\n', '  useEffect,\n  useLayoutEffect,\n'],
    ['import { modalControls } from "@/lib/editor/use-modal-keyboard";', 'import { modalControls } from "@/lib/editor/use-modal-keyboard";\nimport { claimEarlyCommandIntent } from "@/lib/commands/early-intent";'],
    ['  useEffect(() => {\n    const onKeyDown', '  useLayoutEffect(() => {\n    const onKeyDown'],
    ['    return () => window.removeEventListener("keydown", onKeyDown, true);', '    const releaseIntent = claimEarlyCommandIntent(openPalette);\n    return () => {\n      releaseIntent();\n      window.removeEventListener("keydown", onKeyDown, true);\n    };'],
  ],
  "lib/editor/use-modal-keyboard.ts": [
    ['import { useEffect, type RefObject }', 'import { useLayoutEffect, type RefObject }'],
    ['  useEffect(() => {', '  useLayoutEffect(() => {'],
  ],
  "lib/editor/use-focus-preserving-overlay.ts": [
    ['import type { Editor } from "@tiptap/core";', 'import type { Editor } from "@tiptap/core";\nimport { captureWritingSelection } from "./writing-selection";'],
    ['    const snapshot = { from: editor?.state.selection.anchor ?? editor?.state.selection.from ?? 0, to: editor?.state.selection.head ?? editor?.state.selection.to ?? 0,', '    const selection = editor ? captureWritingSelection(editor) : null;\n    const snapshot = { from: selection?.anchor ?? 0, to: selection?.head ?? 0,'],
    ['    if (!snapshot) return; requestAnimationFrame(() => { if (editor) { editor.commands.setTextSelection({ from: snapshot.from, to: snapshot.to }); editor.commands.focus(); } else elementRef.current?.focus(); window.scrollTo(snapshot.scrollX, snapshot.scrollY);', '    if (!snapshot) return; requestAnimationFrame(() => {\n      if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== snapshot.route || editor?.isDestroyed) return;\n      if (editor) { editor.commands.setTextSelection({ from: snapshot.from, to: snapshot.to }); editor.commands.focus(undefined, { scrollIntoView: false }); } else elementRef.current?.focus({ preventScroll: true }); window.scrollTo(snapshot.scrollX, snapshot.scrollY);'],
  ],
};

beforeAll(async () => {
  const acceptedSnapshot = await loadFoundation();
  const archive = await JSZip.loadAsync(execFileSync("git", ["archive", "--format=zip", checkpoint], { maxBuffer: 64 * 1024 * 1024 }));
  for (const [path, entry] of Object.entries(archive.files)) {
    if (entry.dir) continue;
    const value = fingerprint(await entry.async("nodebuffer"));
    original.set(path, value); acceptedRepair.set(path, fingerprint(acceptedSnapshot.get(path)!));
  }
});

function assertProtected(files: Map<string, string>) {
  for (const [path, baseline] of original) {
    if (path === "Path.md") continue;
    let expected = baseline;
    for (const [from, to] of repairs[path] ?? []) {
      if (!expected.includes(from)) throw new Error(`Repair anchor absent: ${path}`);
      expected = expected.replace(from, to);
    }
    if (files.get(path) !== expected) throw new Error(`Protected source differs: ${path}`);
  }
}

describe("historical reliability evidence and current authorized appearance boundary", () => {
  it("preserves every existing file except the five exact reviewed leaf substitutions and Path ledger", () => {
    expect(original.size).toBeGreaterThan(640);
    assertProtected(acceptedRepair);
    const ledger = acceptedRepair.get("Path.md")!;
    const historical = original.get("Path.md")!;
    const historyWithoutDashboards = (text: string) => text.split("\n").filter((line) => !line.startsWith("| 7X. Appearance") && !line.startsWith("| 7X-0 |")).join("\n");
    expect(historyWithoutDashboards(ledger)).toContain(historyWithoutDashboards(historical).trimEnd());
  });
  it("audits the complete current working tree in addition to the immutable accepted repair", async () => {
    const foundation = await loadFoundation();
    assertCurrentAppearanceScope(foundation, readCurrentFoundation(foundation));
  });
  it.each(["lib/commands/registry.ts", "tests/e2e/command-palette.spec.ts", "package-lock.json", "WorkPlan.md", "prisma/schema.prisma"])("rejects a synthetic frozen-file edit: %s", (path) => {
    const changed = new Map(acceptedRepair); changed.set(path, `${changed.get(path)}\nmutation`);
    expect(() => assertProtected(changed)).toThrow(`Protected source differs: ${path}`);
  });
  it.each(Object.keys(repairs))("rejects even an unlisted extra change inside a permitted file: %s", (path) => {
    const changed = new Map(acceptedRepair); changed.set(path, `${changed.get(path)}\nmutation`);
    expect(() => assertProtected(changed)).toThrow(`Protected source differs: ${path}`);
  });
  it("rejects an existing-source deletion", () => {
    const changed = new Map(acceptedRepair); changed.delete("lib/commands/registry.ts");
    expect(() => assertProtected(changed)).toThrow("Protected source differs: lib/commands/registry.ts");
  });
});
