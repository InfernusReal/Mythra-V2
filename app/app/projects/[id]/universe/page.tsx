import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { UniverseWorkspace } from "@/components/universe/UniverseWorkspace";
import { requireActor } from "@/lib/auth/runtime";
import { universeService } from "@/lib/universe/runtime";

export default async function UniversePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnChapterId?: string }>;
}) {
  const actor = await requireActor();
  const { id } = await params;
  const query = await searchParams;
  const loaded = await (async () => {
    // The catalog is initialized before the collection query so first access cannot race the system-template transaction.
    const catalog = await universeService().catalog(actor, id, randomUUID());
    const model = await universeService().list(
      actor,
      id,
      { status: "ACTIVE", limit: 50 },
      randomUUID(),
    );
    return { catalog, model };
  })().catch(() => null);
  if (!loaded) notFound();
  return (
    <AppShell>
      <UniverseWorkspace
        projectId={id}
        initialEntities={loaded.model.entities}
        initialCatalog={loaded.catalog}
        initialStructuralVersion={loaded.model.projectStructuralVersion}
        returnChapterId={query.returnChapterId}
      />
    </AppShell>
  );
}
