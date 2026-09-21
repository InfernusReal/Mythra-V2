import { useLocale } from "@/components/i18n/LocaleProvider";
import type { StructureLens } from "@/domains/structure/domain/types";
import type { MessageKey } from "@/lib/i18n/messages";

const labelKeys: Record<StructureLens, MessageKey> = {
  OUTLINE: "outline",
  VOLUMES: "volumes",
  CHAPTERS: "chapters9831375b",
  MILESTONES: "milestones39c33dc2",
  CAUSAL: "causal",
  RELATIONSHIPS: "relationships",
  SEMANTIC_ZOOM: "semanticZoom",
};

export function StructureLensNav({
  lenses,
  active,
  onChange,
}: {
  lenses: readonly StructureLens[];
  active: StructureLens;
  onChange(lens: StructureLens): void;
}) {
  const { messages } = useLocale();
  return (
    <nav className="structure-lenses" aria-label={messages.structureLenses}>
      {lenses.map((lens) => (
        <button
          key={lens}
          type="button"
          aria-current={active === lens ? "page" : undefined}
          onClick={() => onChange(lens)}
        >
          {messages[labelKeys[lens]]}
        </button>
      ))}
    </nav>
  );
}
