"use client";

import type { ComponentType } from "react";
import type { ContextFieldDescriptor } from "@/domains/context/domain/types";

export function ChapterOutlineCard({ descriptor }: { descriptor: ContextFieldDescriptor }) { return <><p>{descriptor.summary}</p>{typeof descriptor.payload.emotionalMovement === "string" ? <small>Movement: {descriptor.payload.emotionalMovement}</small> : null}</>; }
export function MilestoneContextCard({ descriptor }: { descriptor: ContextFieldDescriptor }) { return <><p>{descriptor.summary}</p><small>Role: {String(descriptor.payload.role ?? "linked")}</small></>; }
export function CausalContextCard({ descriptor }: { descriptor: ContextFieldDescriptor }) { return <><p>{descriptor.summary}</p><small>{descriptor.payload.direction === "UPSTREAM" ? "Direct prerequisite" : "Direct consequence"}</small></>; }
export function ExistingReferenceCard({ descriptor }: { descriptor: ContextFieldDescriptor }) { return <><p>{descriptor.summary}</p><small>{String(descriptor.payload.targetType ?? "reference")}</small></>; }
export function NarrativeIntentCard({ descriptor }: { descriptor: ContextFieldDescriptor }) { return <><p>{descriptor.summary}</p><small>{String(descriptor.payload.category ?? "Author intent")}</small></>; }
export function CaptureContextCard({ descriptor }: { descriptor: ContextFieldDescriptor }) { return <><p>{descriptor.summary}</p><small>{String(descriptor.payload.lifecycle ?? "UNPROCESSED")}</small></>; }

export const contextCardRegistry = {
  CHAPTER_OUTLINE: ChapterOutlineCard,
  MILESTONE: MilestoneContextCard,
  CAUSAL: CausalContextCard,
  REFERENCE: ExistingReferenceCard,
  NARRATIVE_INTENT: NarrativeIntentCard,
  CAPTURE: CaptureContextCard
} satisfies Record<ContextFieldDescriptor["type"], ComponentType<{ descriptor: ContextFieldDescriptor }>>;
