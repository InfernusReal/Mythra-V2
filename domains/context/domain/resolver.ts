import { createHash } from "node:crypto";
import type { ContextSnapshot } from "../application/ports";
import { compileNarrativeDirective } from "./directive";
import { ContextProviderRegistry, type ContextProvider } from "./registry";
import { descriptorId, type ContextAction, type ContextCardType, type ContextFieldReadModel, type ContextQuery } from "./types";

function sourceActions(type: ContextCardType, id: string, pinned: boolean, href: string, causal?: { endpointType: string; endpointId: string; blockId?: string }): ContextAction[] {
  const actions: ContextAction[] = [{ type: "PEEK", label: "Peek" }, { type: "OPEN", label: "Open", href }, { type: pinned ? "UNPIN" : "PIN", label: pinned ? "Unpin" : "Pin" }, { type: "HIDE_SESSION", label: "Hide for session" }, { type: "MUTE_TYPE", label: "Mute this card type" }];
  if (type === "CHAPTER_OUTLINE" || type === "NARRATIVE_INTENT") actions.push({ type: "EDIT_SOURCE", label: "Edit source" }, { type: "MARK_INTENTIONAL", label: "Mark intentional" });
  if (causal) actions.push({ type: "WHY_NOW", label: "Why now?", ...causal }, { type: "WHAT_CHANGES", label: "What changes?", ...causal });
  return actions;
}

const structureHref = (snapshot: ContextSnapshot) => `/app/projects/${snapshot.projectId}/structure?returnChapterId=${snapshot.chapterId}`;

function base(snapshot: ContextSnapshot, query: ContextQuery, type: ContextCardType, id: string, version: number) {
  const pinned = snapshot.pins.some((pin) => pin.cardType === type && pin.sourceId === id);
  const selected = query.selectedIds.includes(id); const peek = query.peekType === type && query.peekId === id;
  return { pinned, reason: pinned ? "PINNED" as const : selected ? "SELECTION" as const : peek ? "PEEK" as const : "CHAPTER" as const, priority: pinned ? 1000 : selected ? 900 : peek ? 850 : 0, stale: version > snapshot.projectStructuralVersion };
}

const providers: ContextProvider[] = [
  { id: "chapter-outline", produce(snapshot, query) { return [...(snapshot.outline ? [snapshot.outline] : []), ...snapshot.extraOutlines].map((source) => { const state = base(snapshot, query, "CHAPTER_OUTLINE", source.id, source.version); return { id: descriptorId("CHAPTER_OUTLINE", source.id), type: "CHAPTER_OUTLINE" as const, ...state, priority: state.priority || (source.id === snapshot.outline?.id ? 700 : 300), source: { type: "CHAPTER_OUTLINE" as const, id: source.id, version: source.version }, title: source.title, summary: source.purpose ?? source.emotionalMovement ?? "Chapter outline", payload: { purpose: source.purpose, emotionalMovement: source.emotionalMovement }, actions: sourceActions("CHAPTER_OUTLINE", source.id, state.pinned, structureHref(snapshot)), freshnessVersion: snapshot.projectStructuralVersion, pinnable: true }; }); } },
  { id: "milestone", produce(snapshot, query) { return snapshot.milestones.map((source) => { const state = base(snapshot, query, "MILESTONE", source.id, source.version); return { id: descriptorId("MILESTONE", source.id), type: "MILESTONE" as const, ...state, priority: state.priority || 600 + Math.round(source.weight * 10), source: { type: "MILESTONE" as const, id: source.id, version: source.version }, title: source.title, summary: source.description ?? source.role, payload: { role: source.role, weight: source.weight }, actions: sourceActions("MILESTONE", source.id, state.pinned, structureHref(snapshot)), freshnessVersion: snapshot.projectStructuralVersion, pinnable: true }; }); } },
  { id: "direct-causal", produce(snapshot, query) { return snapshot.causal.map((source) => { const state = base(snapshot, query, "CAUSAL", source.id, source.version); const endpoint = { endpointType: source.anchorType, endpointId: source.anchorId, ...(source.anchorBlockId ? { blockId: source.anchorBlockId } : {}) }; return { id: descriptorId("CAUSAL", source.id), type: "CAUSAL" as const, ...state, reason: state.reason === "CHAPTER" ? "CURSOR" as const : state.reason, priority: state.priority || 550 + Math.min(49, Math.round(source.importance / 3)), source: { type: "CAUSAL" as const, id: source.id, version: source.version }, title: source.direction === "UPSTREAM" ? "Because" : "Consequence", summary: `${source.relationType}: ${source.endpointLabel}`, payload: { direction: source.direction, relationType: source.relationType, endpoint }, actions: sourceActions("CAUSAL", source.id, state.pinned, structureHref(snapshot), endpoint), freshnessVersion: snapshot.projectStructuralVersion, pinnable: true }; }); } },
  { id: "existing-reference", produce(snapshot, query) { return snapshot.references.map((source) => { const original = base(snapshot, query, "REFERENCE", source.id, source.version); const selected = query.selectedIds.includes(source.targetId); const state = selected && !original.pinned ? { ...original, reason: "SELECTION" as const, priority: 900 } : original; const cursor = Boolean(query.cursorBlockId && source.sourceBlockId === query.cursorBlockId); return { id: descriptorId("REFERENCE", source.id), type: "REFERENCE" as const, ...state, reason: state.reason === "CHAPTER" && cursor ? "CURSOR" as const : state.reason, priority: state.priority || (cursor ? 800 : 400), source: { type: "REFERENCE" as const, id: source.id, version: source.version, ...(source.sourceBlockId ? { blockId: source.sourceBlockId } : {}) }, title: source.targetLabel, summary: source.relationshipKey, payload: { sourceType: source.sourceType, targetType: source.targetType, targetId: source.targetId }, actions: sourceActions("REFERENCE", source.id, state.pinned, structureHref(snapshot)), freshnessVersion: snapshot.projectStructuralVersion, pinnable: true }; }); } },
  { id: "narrative-intent", produce(snapshot, query) { return snapshot.intents.map((source) => { const state = base(snapshot, query, "NARRATIVE_INTENT", source.id, source.version); const cursor = Boolean(query.cursorBlockId && source.blockId === query.cursorBlockId); return { id: descriptorId("NARRATIVE_INTENT", source.id), type: "NARRATIVE_INTENT" as const, ...state, reason: state.reason === "CHAPTER" && cursor ? "CURSOR" as const : state.reason, priority: state.priority || (cursor ? 790 : 450), source: { type: "NARRATIVE_INTENT" as const, id: source.id, version: source.version, ...(source.blockId ? { blockId: source.blockId } : {}) }, title: source.customCategory ?? source.category ?? "Narrative intent", summary: source.intentText, payload: { category: source.category }, actions: sourceActions("NARRATIVE_INTENT", source.id, state.pinned, structureHref(snapshot)), freshnessVersion: snapshot.projectStructuralVersion, pinnable: true }; }); } }
];

export function makeContextKey(snapshot: Pick<ContextSnapshot, "chapterId" | "chapterVersion" | "projectStructuralVersion" | "pins">, query: ContextQuery): string {
  const stable = JSON.stringify({ chapterId: snapshot.chapterId, chapterVersion: snapshot.chapterVersion, structuralVersion: snapshot.projectStructuralVersion, cursorBlockId: query.cursorBlockId ?? null, selectedIds: [...query.selectedIds].sort(), pins: snapshot.pins.map((pin) => `${pin.cardType}:${pin.sourceId}`).sort(), causal: [query.activeCausalType ?? null, query.activeCausalId ?? null, query.activeCausalBlockId ?? null] });
  return createHash("sha256").update(stable).digest("hex");
}

export class DeterministicContextResolver {
  readonly registry = new ContextProviderRegistry();
  constructor() { for (const provider of providers) this.registry.register(provider); }
  resolve(snapshot: ContextSnapshot, query: ContextQuery): ContextFieldReadModel {
    const contextKey = makeContextKey(snapshot, query); const muted = new Set(snapshot.preferences.mutedTypes);
    const eligible = this.registry.resolve(snapshot, query).filter((descriptor) => descriptor.pinned || !muted.has(descriptor.type)).sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id));
    const descriptors = eligible.slice(0, query.cardCap); const hasMore = eligible.length > descriptors.length;
    if (hasMore) descriptors.at(-1)?.actions.push({ type: "MORE", label: `More (${eligible.length - descriptors.length})` });
    const directive = compileNarrativeDirective(snapshot); const stale = Boolean(query.requestedContextKey && query.requestedContextKey !== contextKey);
    if (stale) directive.stale = true;
    const state = query.peekType === "CAUSAL" ? "CAUSAL_PEEK" : query.peekType ? "PEEK" : query.selectedIds.length ? "SELECTION" : query.cursorBlockId ? "CHAPTER" : "CHAPTER";
    return { contextKey, requestedContextKey: query.requestedContextKey ?? null, state, chapterId: snapshot.chapterId, chapterVersion: snapshot.chapterVersion, projectId: snapshot.projectId, projectStructuralVersion: snapshot.projectStructuralVersion, descriptors, directive, preferences: snapshot.preferences, pinKeys: snapshot.pins.map((pin) => `${pin.cardType}:${pin.sourceId}`).sort(), page: { cardCap: query.cardCap, returnedCards: descriptors.length, totalEligibleCards: eligible.length, hasMore } };
  }
}
