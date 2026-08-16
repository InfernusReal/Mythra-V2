"use client";

import type { NarrativeDirectiveProjection } from "@/domains/context/domain/types";

const sections = [["Purpose", "purposeItems"], ["Advance", "advanceItems"], ["Preserve", "preserveItems"], ["Reader outcome", "readerOutcomeItems"], ["Next", "nextItems"], ["Relevant context", "relevantContextItems"], ["Because", "becauseItems"], ["Consequences", "consequenceItems"]] as const;
export function RelevantNow({ directive, onPeek }: { directive: NarrativeDirectiveProjection; onPeek: (id: string) => void }) {
  if (directive.disabled) return <section className="relevant-now"><h2>Relevant Now</h2><p>Disabled for this project.</p></section>;
  return <section className="relevant-now" aria-label="Relevant Now"><header><h2>Relevant Now</h2><span>{directive.stale ? "Stale — refresh required" : `Fresh at structure v${directive.freshnessVersion}`}</span></header>{sections.map(([label, key]) => directive[key].length ? <div key={key}><h3>{label}</h3><ul>{directive[key].map((item) => <li key={item.id}><button onClick={() => onPeek(item.peekDescriptorId)}>{item.text}</button></li>)}</ul></div> : null)}</section>;
}
