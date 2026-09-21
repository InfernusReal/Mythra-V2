import "fake-indexeddb/auto";
import axe from "axe-core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Editor } from "@tiptap/core";
import { QuickCaptureOverlay } from "@/components/capture/QuickCaptureOverlay";

describe("Capture accessibility", () => {
  it("has no serious or critical issue in the global overlay", async () => { vi.spyOn(console, "log").mockImplementation(() => undefined); vi.spyOn(window, "scrollTo").mockImplementation(() => undefined); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: {} }), { status: 200 }))); const editor = { state: { selection: { from: 1, to: 1, $from: { parent: { attrs: {} } } } }, commands: { setTextSelection: vi.fn(), focus: vi.fn() } } as unknown as Editor; const { container } = render(<QuickCaptureOverlay editor={editor} projectId="80000000-0000-4000-8000-000000000001" chapterId="80000000-0000-4000-8000-000000000002" />); fireEvent.keyDown(window, { code: "Space", ctrlKey: true, shiftKey: true }); expect(screen.getByRole("dialog", { name: "Capture" })).toBeVisible(); const results = await axe.run(container); expect(results.violations.filter((item) => item.impact === "critical" || item.impact === "serious")).toEqual([]); });
});
