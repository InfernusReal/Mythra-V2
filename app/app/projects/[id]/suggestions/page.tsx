import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { SuggestionInbox } from "@/components/suggestions/SuggestionInbox";
import { requireActor } from "@/lib/auth/runtime";
import { logger } from "@/lib/observability/logger";
import { suggestionService } from "@/lib/suggestions/runtime";

export default async function SuggestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const model = await suggestionService().list(actor, id, { limit: 100 }, randomUUID()).catch(() => null);
  if (!model) notFound();
  // Console trace S17-SUGGESTION-UI-002: server-rendered inbox records project identity and bounded counts only.
  logger.info("suggestion.inbox_rendered", { step: "S17-SUGGESTION-UI-002", workspaceId: actor.workspaceId, projectId: id, suggestionCount: model.suggestions.length, hasMore: Boolean(model.nextCursor) });
  return <AppShell><SuggestionInbox projectId={id} initialSuggestions={model.suggestions} initialCursor={model.nextCursor} /></AppShell>;
}
