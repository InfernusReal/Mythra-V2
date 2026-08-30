import { archiveCollectionNames, MYTHRA_REPRESENTATION_VERSION, type ProjectArchive } from "@/domains/portability/domain/representations";

export function projectArchiveFixture(): ProjectArchive {
  const collections = Object.fromEntries(archiveCollectionNames.map((name) => [name, []])) as unknown as ProjectArchive["collections"];
  collections.chapters.push({ id: "10000000-0000-4000-a000-000000000001", projectId: "00000000-0000-4000-a000-000000000001", sequenceIndex: 0, title: "Opening", bodyText: "A beginning", bodyDocument: { schemaVersion: 1, type: "doc", content: [] }, version: 1 });
  collections.storyChanges.push({ id: "20000000-0000-4000-a000-000000000001", projectId: "00000000-0000-4000-a000-000000000001", kind: "DECISION", title: "Choice", version: 1 });
  collections.causalRelations.push({ id: "30000000-0000-4000-a000-000000000001", projectId: "00000000-0000-4000-a000-000000000001", sourceType: "STORY_CHANGE", sourceId: "20000000-0000-4000-a000-000000000001", targetType: "CHAPTER", targetId: "10000000-0000-4000-a000-000000000001", relationType: "CAUSES", state: "ACTIVE", condition: "Only if selected", note: "Direct fact", provenanceType: "DIRECT", provenanceNote: "Author supplied" });
  return { representation: "mythra.project-archive", representationVersion: MYTHRA_REPRESENTATION_VERSION, generatedAt: "2026-08-30T00:00:00.000Z", project: { id: "00000000-0000-4000-a000-000000000001", workspaceId: "00000000-0000-4000-a000-000000000002", title: "Project", structuralVersion: 7 }, collections, manuscriptMarkdown: "# Opening\n\nA beginning" };
}
