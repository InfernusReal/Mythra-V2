import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SuggestionInbox } from "@/components/suggestions/SuggestionInbox";
import type { SuggestionReadModel } from "@/domains/suggestions/domain/types";

const id = (n: number) => `80000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const suggestion: SuggestionReadModel = { id: id(2), projectId: id(1), sourceAgent: "continuity.agent", category: "continuity", targetType: "CHAPTER", targetId: id(3), sourceBlockId: null, finding: "A character knows an unrevealed fact.", evidenceReferences: [{ type: "CHAPTER", id: id(3), relationship: "supports" }], proposedActions: [{ actionType: "manual", payload: {} }], confidence: 0.8, status: "open", authorNote: null, version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), resolvedAt: null };

beforeEach(() => { vi.restoreAllMocks(); vi.spyOn(console, "log").mockImplementation(() => undefined); });

describe("SuggestionInbox", () => {
  it("renders evidence and records an explicit decision without claiming a canonical mutation", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { ...suggestion, status: "accepted", version: 2, resolvedAt: new Date().toISOString() } }), { status: 200 }));
    render(<SuggestionInbox projectId={id(1)} initialSuggestions={[suggestion]} initialCursor={null} />);
    expect(screen.getByText(suggestion.finding)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Accept finding" }));
    expect(await screen.findByText(/Canonical story data was not changed/)).toBeVisible();
    await waitFor(() => expect(console.log).toHaveBeenCalledWith(expect.stringContaining('"step":"S17-SUGGESTION-UI-001"')));
  });

  it("requires an author note for a modified decision", () => {
    const fetcher = vi.spyOn(globalThis, "fetch");
    render(<SuggestionInbox projectId={id(1)} initialSuggestions={[suggestion]} initialCursor={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Accept with modification" }));
    expect(screen.getByRole("status")).toHaveTextContent("requires an author note");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
