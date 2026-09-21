import type { ContextSnapshot } from "../application/ports";
import {
  descriptorId,
  type DirectiveItem,
  type NarrativeDirectiveProjection,
} from "./types";

const item = (
  id: string,
  text: string,
  source: DirectiveItem["source"],
  rank: number,
  leadingCode?: string,
  textCode?: string,
): DirectiveItem => ({
  id,
  text,
  ...(leadingCode ? { leadingCode } : {}),
  ...(textCode ? { textCode } : {}),
  source,
  peekDescriptorId: descriptorId(source.type, source.id),
  rank,
});
const sorted = (items: DirectiveItem[]) =>
  items
    .sort(
      (left, right) =>
        right.rank - left.rank || left.id.localeCompare(right.id),
    )
    .slice(0, 4);

export function compileNarrativeDirective(
  snapshot: ContextSnapshot,
): NarrativeDirectiveProjection {
  const outline = snapshot.outline;
  const purposeItems = outline?.purpose
    ? [
        item(
          `purpose:${outline.id}`,
          outline.purpose,
          { type: "CHAPTER_OUTLINE", id: outline.id, version: outline.version },
          100,
        ),
      ]
    : [];
  const advanceItems = snapshot.milestones.map((source) =>
    item(
      `advance:${source.id}`,
      source.title,
      { type: "MILESTONE", id: source.id, version: source.version },
      80 + source.weight,
      source.role,
    ),
  );
  const preserveItems = snapshot.intents
    .filter((source) =>
      ["TENSION", "AMBIGUITY", "ATMOSPHERE"].includes(source.category ?? ""),
    )
    .map((source) =>
      item(
        `preserve:${source.id}`,
        source.intentText,
        {
          type: "NARRATIVE_INTENT",
          id: source.id,
          version: source.version,
          ...(source.blockId ? { blockId: source.blockId } : {}),
        },
        70,
      ),
    );
  const readerOutcomeItems = snapshot.intents
    .filter((source) =>
      ["REVELATION", "EMOTION"].includes(source.category ?? ""),
    )
    .map((source) =>
      item(
        `outcome:${source.id}`,
        source.intentText,
        {
          type: "NARRATIVE_INTENT",
          id: source.id,
          version: source.version,
          ...(source.blockId ? { blockId: source.blockId } : {}),
        },
        70,
      ),
    );
  const nextItems = snapshot.intents
    .filter((source) => source.category === "PACING")
    .map((source) =>
      item(
        `next:${source.id}`,
        source.intentText,
        {
          type: "NARRATIVE_INTENT",
          id: source.id,
          version: source.version,
          ...(source.blockId ? { blockId: source.blockId } : {}),
        },
        65,
      ),
    );
  const relevantContextItems = snapshot.references.map((source) =>
    item(
      `reference:${source.id}`,
      source.targetLabel,
      {
        type: "REFERENCE",
        id: source.id,
        version: source.version,
        ...(source.sourceBlockId ? { blockId: source.sourceBlockId } : {}),
      },
      source.sourceBlockId ? 60 : 40,
      source.relationshipKey,
      source.targetLabel ? undefined : source.targetType,
    ),
  );
  const becauseItems = snapshot.causal
    .filter((source) => source.direction === "UPSTREAM")
    .map((source) =>
      item(
        `because:${source.id}`,
        source.endpointLabel,
        {
          type: "CAUSAL",
          id: source.id,
          version: source.version,
          ...(source.endpointBlockId
            ? { blockId: source.endpointBlockId }
            : {}),
        },
        90 + source.importance,
        source.relationType,
        source.endpointLabel ? undefined : source.endpointType,
      ),
    );
  const consequenceItems = snapshot.causal
    .filter((source) => source.direction === "DOWNSTREAM")
    .map((source) =>
      item(
        `consequence:${source.id}`,
        source.endpointLabel,
        {
          type: "CAUSAL",
          id: source.id,
          version: source.version,
          ...(source.endpointBlockId
            ? { blockId: source.endpointBlockId }
            : {}),
        },
        90 + source.importance,
        source.relationType,
        source.endpointLabel ? undefined : source.endpointType,
      ),
    );
  return {
    chapterId: snapshot.chapterId,
    chapterVersion: snapshot.chapterVersion,
    projectStructuralVersion: snapshot.projectStructuralVersion,
    freshnessVersion: snapshot.projectStructuralVersion,
    stale: false,
    disabled: !snapshot.preferences.directiveEnabled,
    purposeItems: sorted(purposeItems),
    advanceItems: sorted(advanceItems),
    preserveItems: sorted(preserveItems),
    readerOutcomeItems: sorted(readerOutcomeItems),
    nextItems: sorted(nextItems),
    relevantContextItems: sorted(relevantContextItems),
    becauseItems: sorted(becauseItems),
    consequenceItems: sorted(consequenceItems),
  };
}
