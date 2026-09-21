"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  localizedEntityTemplateName,
  localizedEnumLabel,
  localizedEnumLabelOrValue,
} from "@/lib/i18n/messages";

import type { ComponentType } from "react";
import type { ContextFieldDescriptor } from "@/domains/context/domain/types";

export function ChapterOutlineCard({
  descriptor,
}: {
  descriptor: ContextFieldDescriptor;
}) {
  const { messages } = useLocale();
  return (
    <>
      <p>{descriptor.summary || messages.chapterOutline}</p>
      {typeof descriptor.payload.emotionalMovement === "string" ? (
        <small>
          {messages.movement} {descriptor.payload.emotionalMovement}
        </small>
      ) : null}
    </>
  );
}
export function MilestoneContextCard({
  descriptor,
}: {
  descriptor: ContextFieldDescriptor;
}) {
  const { messages } = useLocale();
  return (
    <>
      <p>{descriptor.summary}</p>
      <small>
        {messages.role44dd5f16}{" "}
        {typeof descriptor.payload.role === "string"
          ? localizedEnumLabel(messages, descriptor.payload.role)
          : messages.linked}
      </small>
    </>
  );
}
export function CausalContextCard({
  descriptor,
}: {
  descriptor: ContextFieldDescriptor;
}) {
  const { messages } = useLocale();
  return (
    <>
      <p>
        {typeof descriptor.payload.relationType === "string"
          ? `${localizedEnumLabelOrValue(messages, descriptor.payload.relationType)}: `
          : ""}
        {descriptor.summary ||
          (typeof descriptor.payload.endpointType === "string"
            ? localizedEnumLabel(messages, descriptor.payload.endpointType)
            : messages.causal)}
      </p>
      <small>
        {descriptor.payload.direction === "UPSTREAM"
          ? messages.directPrerequisite
          : messages.directConsequence}
      </small>
    </>
  );
}
export function ExistingReferenceCard({
  descriptor,
}: {
  descriptor: ContextFieldDescriptor;
}) {
  const { messages } = useLocale();
  return (
    <>
      <p>{localizedEnumLabelOrValue(messages, descriptor.summary)}</p>
      <small>
        {typeof descriptor.payload.targetType === "string"
          ? localizedEnumLabel(messages, descriptor.payload.targetType)
          : messages.reference}
      </small>
    </>
  );
}
export function NarrativeIntentCard({
  descriptor,
}: {
  descriptor: ContextFieldDescriptor;
}) {
  const { messages } = useLocale();
  return (
    <>
      <p>{descriptor.summary}</p>
      <small>
        {typeof descriptor.payload.category === "string"
          ? localizedEnumLabel(messages, descriptor.payload.category)
          : messages.authorIntent}
      </small>
    </>
  );
}
export function CaptureContextCard({
  descriptor,
}: {
  descriptor: ContextFieldDescriptor;
}) {
  const { messages } = useLocale();
  return (
    <>
      <p>{descriptor.summary}</p>
      <small>
        {typeof descriptor.payload.lifecycle === "string"
          ? localizedEnumLabel(messages, descriptor.payload.lifecycle)
          : messages.unprocessed}
      </small>
    </>
  );
}
export function EntityContextCard({
  descriptor,
}: {
  descriptor: ContextFieldDescriptor;
}) {
  const { messages } = useLocale();
  return (
    <>
      <p>
        {descriptor.summary ||
          localizedEntityTemplateName(
            messages,
            typeof descriptor.payload.typeSystemKey === "string"
              ? descriptor.payload.typeSystemKey
              : null,
            typeof descriptor.payload.typeName === "string"
              ? descriptor.payload.typeName
              : messages.entity,
          )}
      </p>
      <small>
        {localizedEntityTemplateName(
          messages,
          typeof descriptor.payload.typeSystemKey === "string"
            ? descriptor.payload.typeSystemKey
            : null,
          typeof descriptor.payload.typeName === "string"
            ? descriptor.payload.typeName
            : messages.entity,
        )}
      </small>
    </>
  );
}
export function SearchContextCard({
  descriptor,
}: {
  descriptor: ContextFieldDescriptor;
}) {
  const { messages } = useLocale();
  return (
    <>
      <p>{descriptor.summary}</p>
      <small>{messages.searchResult}</small>
    </>
  );
}
export function LanguageContextCard({
  descriptor,
}: {
  descriptor: ContextFieldDescriptor;
}) {
  const { messages } = useLocale();
  return (
    <>
      <p>{descriptor.summary}</p>
      <small>{messages.languageLookup}</small>
    </>
  );
}
export function TimelineContextCard({
  descriptor,
}: {
  descriptor: ContextFieldDescriptor;
}) {
  const { messages } = useLocale();
  return (
    <>
      <p>{descriptor.summary}</p>
      <small>
        {typeof descriptor.payload.mode === "string"
          ? localizedEnumLabel(messages, descriptor.payload.mode)
          : messages.storyTime}
      </small>
    </>
  );
}
export function NoteContextCard({
  descriptor,
}: {
  descriptor: ContextFieldDescriptor;
}) {
  const { messages } = useLocale();
  return (
    <>
      <p>{descriptor.summary}</p>
      <small>{messages.durableNote}</small>
    </>
  );
}
export function ResearchContextCard({
  descriptor,
}: {
  descriptor: ContextFieldDescriptor;
}) {
  const { messages } = useLocale();
  return (
    <>
      <p>{descriptor.summary || messages.researchLabel}</p>
      <small>
        {typeof descriptor.payload.kind === "string"
          ? localizedEnumLabel(messages, descriptor.payload.kind)
          : messages.researchLabel}
      </small>
    </>
  );
}

export const contextCardRegistry = {
  CHAPTER_OUTLINE: ChapterOutlineCard,
  MILESTONE: MilestoneContextCard,
  CAUSAL: CausalContextCard,
  REFERENCE: ExistingReferenceCard,
  NARRATIVE_INTENT: NarrativeIntentCard,
  CAPTURE: CaptureContextCard,
  ENTITY: EntityContextCard,
  SEARCH: SearchContextCard,
  LANGUAGE: LanguageContextCard,
  TIMELINE: TimelineContextCard,
  NOTE: NoteContextCard,
  RESEARCH: ResearchContextCard,
} satisfies Record<
  ContextFieldDescriptor["type"],
  ComponentType<{ descriptor: ContextFieldDescriptor }>
>;
