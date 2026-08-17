"use client";

import type { SearchResult } from "@/domains/search/domain/types";

export function SearchPeek({ result, onClose }: { result: SearchResult; onClose: () => void }) {
  return <section className="search-peek" role="dialog" aria-modal="false" aria-labelledby="search-peek-title"><header><div><p className="eyebrow">Peek</p><h3 id="search-peek-title">{result.title}</h3></div><button type="button" autoFocus onClick={onClose}>Return to results</button></header><p>{result.snippet || "No text preview."}</p><dl><div><dt>Type</dt><dd>{result.documentType.replaceAll("_", " ").toLocaleLowerCase()}</dd></div><div><dt>Match</dt><dd>{result.matchReasons.join(", ")}</dd></div><div><dt>Freshness</dt><dd>{result.freshness.toLocaleLowerCase()}</dd></div></dl></section>;
}
