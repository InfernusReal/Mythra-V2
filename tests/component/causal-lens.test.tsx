import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CausalLens } from "@/components/structure/CausalLens";
import type { CausalOverview } from "@/domains/causality/application/ports";
import type { StructureOverview } from "@/domains/structure/application/ports";

const id = (value: number) =>
  `00000000-0000-4000-8000-${value.toString().padStart(12, "0")}`;
const structure = {
  project: {
    id: id(1),
    title: "Project",
    structuralVersion: 7,
    activeChapterId: id(2),
  },
  viewState: { mode: "ARCHITECT" },
} as StructureOverview;
const model: CausalOverview = {
  projectStructuralVersion: 7,
  storyChanges: [
    {
      id: id(3),
      kind: "EVENT",
      title: "Door opens",
      description: null,
      storyTime: 1,
      discoveryTime: null,
      anchor: null,
      isPlaceholder: false,
      version: 1,
      archivedAt: null,
    },
    {
      id: id(4),
      kind: "OUTCOME",
      title: "Alarm sounds",
      description: null,
      storyTime: 2,
      discoveryTime: null,
      anchor: null,
      isPlaceholder: false,
      version: 1,
      archivedAt: null,
    },
  ],
  endpoints: [
    { type: "STORY_CHANGE", id: id(3), label: "Door opens", archived: false },
    { type: "STORY_CHANGE", id: id(4), label: "Alarm sounds", archived: false },
  ],
  relations: [
    {
      id: id(5),
      source: { type: "STORY_CHANGE", id: id(3) },
      target: { type: "STORY_CHANGE", id: id(4) },
      relationType: "CAUSES",
      condition: null,
      strength: 1,
      importance: 50,
      state: "ACTIVE",
      isHard: false,
      temporalProgression: false,
      mutualStateSemantics: false,
      note: null,
      provenanceType: "DIRECT",
      provenanceNote: null,
      version: 1,
      archivedAt: null,
    },
  ],
  page: {
    nodeBudget: 200,
    edgeBudget: 300,
    returnedNodes: 2,
    returnedEdges: 1,
    hasMoreNodes: false,
    hasMoreEdges: false,
  },
};

afterEach(() => vi.restoreAllMocks());

describe("CausalLens", () => {
  it("renders accessible relations and optional Architect local graph", () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const changed = vi.fn();
    const view = render(
      <CausalLens
        structure={structure}
        model={model}
        presentationMode="DISCOVERY"
        onChanged={changed}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Causal relationships" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Local graph" }),
    ).not.toBeInTheDocument();
    view.rerender(
      <CausalLens
        structure={structure}
        model={model}
        presentationMode="ARCHITECT"
        onChanged={changed}
      />,
    );
    expect(screen.getByRole("heading", { name: "Local graph" })).toBeVisible();
    expect(
      screen.getByText(
        "The relationship list above is the accessible equivalent.",
      ),
    ).toBeVisible();
  });

  it("creates one-line changes and both phrase directions without logging content", async () => {
    const changed = vi.fn();
    const consoleSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(
        async () =>
          new Response(
            JSON.stringify({
              data: { object: {}, projectStructuralVersion: 8 },
            }),
            { status: 200 },
          ),
      );
    render(
      <CausalLens
        structure={structure}
        model={model}
        presentationMode="DISCOVERY"
        onChanged={changed}
      />,
    );
    fireEvent.change(screen.getByLabelText("Change"), {
      target: { value: "Private secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Story Change" }));
    await waitFor(() => expect(changed).toHaveBeenCalledOnce());
    fireEvent.click(
      screen.getByRole("button", { name: "Record causal relation" }),
    );
    await waitFor(() => expect(changed).toHaveBeenCalledTimes(2));
    expect(String(fetchSpy.mock.calls[1]?.[1]?.body)).toContain(
      `"source":{"type":"STORY_CHANGE","id":"${id(4)}"}`,
    );
    expect(consoleSpy.mock.calls.flat().join("\n")).not.toContain(
      "Private secret",
    );
  });

  it("loads bounded impact and exposes potentially affected provenance", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            root: model.endpoints[0],
            paths: [
              {
                endpoint: model.endpoints[1],
                direction: "DOWNSTREAM",
                depth: 1,
                steps: [
                  {
                    relationId: id(5),
                    relationType: "CAUSES",
                    from: model.relations[0]!.source,
                    to: model.relations[0]!.target,
                    provenanceType: "DIRECT",
                    provenanceNote: null,
                  },
                ],
              },
            ],
            nodeCount: 2,
            edgeCount: 1,
            truncated: false,
            language: "POTENTIALLY_AFFECTED",
          },
        }),
        { status: 200 },
      ),
    );
    render(
      <CausalLens
        structure={structure}
        model={model}
        presentationMode="DISCOVERY"
        onChanged={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "What changes?" }));
    expect(
      await screen.findByText(/1 potentially affected paths/i),
    ).toBeVisible();
    expect(screen.getByText(/Causes \[Direct\]/)).toBeVisible();
  });

  it("keeps zero causality optional without an empty dashboard or warning", () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(
      <CausalLens
        structure={structure}
        model={{
          ...model,
          storyChanges: [],
          endpoints: [],
          relations: [],
          page: { ...model.page, returnedNodes: 0, returnedEdges: 0 },
        }}
        presentationMode="DISCOVERY"
        onChanged={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "One-line Story Change" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Causal relationships" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("reports stable failures and supports explicit retire/archive choices", async () => {
    const changed = vi.fn();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    let calls = 0;
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () =>
        ++calls === 1
          ? new Response(
              JSON.stringify({ error: { message: "Version conflict" } }),
              { status: 409 },
            )
          : new Response(
              JSON.stringify({
                data: { object: {}, projectStructuralVersion: 8 },
              }),
              { status: 200 },
            ),
      );
    render(
      <CausalLens
        structure={structure}
        model={model}
        presentationMode="DISCOVERY"
        onChanged={changed}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Why now?" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The causal operation failed.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Retire" }));
    await waitFor(() => expect(changed).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole("button", { name: "Archive relation" }));
    await waitFor(() => expect(changed).toHaveBeenCalledTimes(2));
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
