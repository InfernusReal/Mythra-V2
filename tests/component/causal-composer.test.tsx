import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Editor } from "@tiptap/core";
import { CausalComposer } from "@/components/editor/CausalComposer";
import { emptyCausality } from "@/tests/fixtures/causality";

const id = (value: number) =>
  `00000000-0000-4000-8000-${value.toString().padStart(12, "0")}`;
const blockId = id(3);
const focus = vi.fn();
const setTextSelection = vi.fn();
const editor = {
  state: {
    selection: { from: 4, to: 9, $from: { parent: { attrs: { blockId } } } },
  },
  commands: { focus, setTextSelection },
} as unknown as Editor;

afterEach(() => {
  vi.restoreAllMocks();
  focus.mockClear();
  setTextSelection.mockClear();
});

describe("CausalComposer", () => {
  it("creates a manuscript-block phrase and restores exact selection/focus/scroll without prose", async () => {
    const scroll = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => undefined);
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 321,
    });
    const consoleSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    let call = 0;
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => {
        call += 1;
        if (call === 1)
          return new Response(
            JSON.stringify({
              data: { ...emptyCausality, projectStructuralVersion: 7 },
            }),
            { status: 200 },
          );
        if (call === 2)
          return new Response(
            JSON.stringify({
              data: {
                object: {
                  id: id(4),
                  kind: "EVENT",
                  title: "Private consequence",
                  description: null,
                  storyTime: null,
                  discoveryTime: null,
                  anchor: { type: "MANUSCRIPT_BLOCK", id: id(2), blockId },
                  isPlaceholder: false,
                  version: 1,
                  archivedAt: null,
                },
                projectStructuralVersion: 8,
              },
            }),
            { status: 201 },
          );
        return new Response(
          JSON.stringify({
            data: { object: { id: id(5) }, projectStructuralVersion: 9 },
          }),
          { status: 201 },
        );
      });
    render(
      <CausalComposer editor={editor} projectId={id(1)} chapterId={id(2)} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Add cause or consequence" }),
    );
    expect(
      await screen.findByRole("dialog", {
        name: "Connect this manuscript moment",
      }),
    ).toBeVisible();
    fireEvent.change(screen.getByLabelText("Story Change"), {
      target: { value: "Private consequence" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Record relationship" }),
    );
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(focus).toHaveBeenCalled());
    expect(setTextSelection).toHaveBeenCalledWith({ from: 4, to: 9 });
    expect(scroll).toHaveBeenCalledWith(0, 321);
    expect(String(fetchSpy.mock.calls[1]?.[1]?.body)).toContain(
      `"anchor":{"type":"MANUSCRIPT_BLOCK","id":"${id(2)}","blockId":"${blockId}"}`,
    );
    expect(String(fetchSpy.mock.calls[2]?.[1]?.body)).toContain(
      '"provenanceType":"CHAPTER_PROSE"',
    );
    expect(consoleSpy.mock.calls.flat().join("\n")).not.toContain(
      "Private consequence",
    );
  });

  it("keeps the composer open on relation failure and returns on explicit cancel", async () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    let call = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      ++call === 1
        ? new Response(JSON.stringify({ data: emptyCausality }), {
            status: 200,
          })
        : call === 2
          ? new Response(
              JSON.stringify({
                data: { object: { id: id(4) }, projectStructuralVersion: 8 },
              }),
              { status: 201 },
            )
          : new Response(
              JSON.stringify({ error: { message: "Version conflict" } }),
              { status: 409 },
            ),
    );
    render(
      <CausalComposer editor={editor} projectId={id(1)} chapterId={id(2)} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Add cause or consequence" }),
    );
    await screen.findByRole("dialog");
    fireEvent.change(screen.getByLabelText("Story Change"), {
      target: { value: "Change" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Record relationship" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The causal relation could not be created.",
    );
    expect(screen.getByRole("dialog")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Cancel and return to writing" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(focus).toHaveBeenCalled());
  });
});
