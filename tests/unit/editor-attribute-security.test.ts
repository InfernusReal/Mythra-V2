import { describe, expect, it } from "vitest";
import { mergeAttributes } from "@tiptap/core";
import { DOMSerializer } from "@tiptap/pm/model";

describe("editor attribute dependency security", () => {
  it("does not promote JSON prototype keys into inherited DOM attributes", () => {
    const untrusted: Record<string, unknown> = JSON.parse('{"__proto__":{"data-inherited-canary":"unexpected","onerror":"void 0"}}');
    const attributes = mergeAttributes(untrusted);
    expect(Object.getPrototypeOf(attributes)).toBe(Object.prototype);
    expect(attributes["data-inherited-canary"]).toBeUndefined();
    const { dom } = DOMSerializer.renderSpec(document, ["img", attributes]);
    expect(dom).toBeInstanceOf(HTMLElement);
    expect((dom as HTMLElement).hasAttribute("onerror")).toBe(false);
    expect((dom as HTMLElement).hasAttribute("data-inherited-canary")).toBe(false);
  });
  it("preserves normal editor class, style, and stable block identity merging", () => {
    expect(mergeAttributes({ class: "editor first", style: "color: red", "data-block-id": "block" }, { class: "first second", style: "color: blue; font-weight: 600" })).toEqual({ class: "editor first second", style: "color: blue; font-weight: 600", "data-block-id": "block" });
  });
});
