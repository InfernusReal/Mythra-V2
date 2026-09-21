import type { SearchActionKind, SearchResult } from "@/domains/search/domain/types";

export const SEARCH_EDITOR_ACTION = "mythra:search-editor-action";
export const SEARCH_EDITOR_RESULT = "mythra:search-editor-result";

export interface SearchEditorActionDetail {
  action: SearchActionKind | "RETURN_TO_ORIGIN";
  result?: SearchResult;
  projectStructuralVersion: number;
}

export interface SearchEditorResultDetail {
  action: SearchEditorActionDetail["action"];
  ok: boolean;
  message: string;
  projectStructuralVersion?: number;
  sourceKey?: string;
}

export function dispatchSearchEditorAction(detail: SearchEditorActionDetail): void {
  window.dispatchEvent(new CustomEvent<SearchEditorActionDetail>(SEARCH_EDITOR_ACTION, { detail }));
}
