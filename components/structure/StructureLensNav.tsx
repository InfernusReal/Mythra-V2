import type { StructureLens } from "@/domains/structure/domain/types";

const labels: Record<StructureLens, string> = {
  OUTLINE: "Outline",
  VOLUMES: "Volumes",
  CHAPTERS: "Chapters",
  MILESTONES: "Milestones",
  RELATIONSHIPS: "Relationships",
  SEMANTIC_ZOOM: "Semantic Zoom"
};

export function StructureLensNav({ lenses, active, onChange }: { lenses: readonly StructureLens[]; active: StructureLens; onChange(lens: StructureLens): void }) {
  return (
    <nav className="structure-lenses" aria-label="Structure lenses">
      {lenses.map((lens) => <button key={lens} type="button" aria-current={active === lens ? "page" : undefined} onClick={() => onChange(lens)}>{labels[lens]}</button>)}
    </nav>
  );
}
