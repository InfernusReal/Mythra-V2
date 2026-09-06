import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import CapturePage from "@/app/app/projects/[id]/captures/page";
import ResearchPage from "@/app/app/projects/[id]/research/page";

const spies = vi.hoisted(() => ({ captures: vi.fn(), notes: vi.fn(), research: vi.fn() }));
vi.mock("@/lib/auth/runtime", () => ({ requireActor: async () => ({ userId: "actor" }) }));
vi.mock("@/lib/capture/runtime", () => ({ captureService: () => ({ list: spies.captures }) }));
vi.mock("@/lib/notes/runtime", () => ({ noteService: () => ({ list: spies.notes }) }));
vi.mock("@/lib/research/runtime", () => ({ researchService: () => ({ list: spies.research }) }));
vi.mock("@/components/shell/AppShell", () => ({ AppShell: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/capture/CaptureInbox", () => ({ CaptureInbox: () => <div>Capture content unchanged</div> }));
vi.mock("@/components/research/ResearchWorkspace", () => ({ ResearchWorkspace: () => <div>Research forms unchanged</div> }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
const id = "a0000000-0000-4000-8000-000000000001";
const cursor = `2026-09-05T00:00:00.000Z|${id}`;
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("bounded list page continuation", () => {
  it("passes the Capture cursor and preserves the writing return in next/first links", async () => {
    spies.captures.mockResolvedValue({ captures: [], projectStructuralVersion: 1, nextCursor: cursor });
    render(await CapturePage({ params: Promise.resolve({ id }), searchParams: Promise.resolve({ cursor, returnChapterId: id }) }));
    expect(spies.captures).toHaveBeenCalledWith(expect.anything(), id, { limit: 50, dueOnly: false, cursor }, expect.any(String));
    const next = new URL(screen.getByRole("link", { name: "Next Capture page" }).getAttribute("href")!, "https://example.test");
    expect(next.searchParams.get("cursor")).toBe(cursor); expect(next.searchParams.get("returnChapterId")).toBe(id);
    const first = new URL(screen.getByRole("link", { name: "First Capture page" }).getAttribute("href")!, "https://example.test");
    expect(first.searchParams.has("cursor")).toBe(false); expect(first.searchParams.get("returnChapterId")).toBe(id);
  });
  it("keeps Notes and Research independently bounded without dropping the other cursor", async () => {
    spies.notes.mockResolvedValue({ notes: [], projectStructuralVersion: 1, nextCursor: cursor });
    spies.research.mockResolvedValue({ items: [], nextCursor: cursor });
    render(await ResearchPage({ params: Promise.resolve({ id }), searchParams: Promise.resolve({ noteCursor: cursor, researchCursor: cursor, returnChapterId: id }) }));
    for (const list of [spies.notes, spies.research]) expect(list).toHaveBeenCalledWith(expect.anything(), id, { limit: 100, cursor }, expect.any(String));
    for (const [label, cleared, retained] of [["First Note page", "noteCursor", "researchCursor"], ["First Research page", "researchCursor", "noteCursor"]]) {
      const first = new URL(screen.getByRole("link", { name: label }).getAttribute("href")!, "https://example.test");
      expect(first.searchParams.has(cleared!)).toBe(false); expect(first.searchParams.get(retained!)).toBe(cursor); expect(first.searchParams.get("returnChapterId")).toBe(id);
    }
    expect(screen.getByRole("link", { name: "Next Note page" })).toBeVisible(); expect(screen.getByRole("link", { name: "Next Research page" })).toBeVisible();
  });
  it("has no phantom continuation and fails closed on authorization or invalid cursor errors", async () => {
    spies.captures.mockResolvedValueOnce({ captures: [], projectStructuralVersion: 1, nextCursor: null }).mockRejectedValueOnce(new Error("private internal error"));
    render(await CapturePage({ params: Promise.resolve({ id }), searchParams: Promise.resolve({}) }));
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    await expect(CapturePage({ params: Promise.resolve({ id }), searchParams: Promise.resolve({ cursor: "bad" }) })).rejects.toThrow("NOT_FOUND");
    spies.notes.mockRejectedValueOnce(new Error("forbidden")); spies.research.mockResolvedValueOnce({ items: [], nextCursor: null });
    await expect(ResearchPage({ params: Promise.resolve({ id }), searchParams: Promise.resolve({}) })).rejects.toThrow("NOT_FOUND");
  });
});
