import { NoteService } from "@/domains/notes/application/service";
import { PrismaNoteRepository } from "@/domains/notes/infrastructure/prisma-note-repository";
import { getPrisma } from "@/lib/db/prisma";
import { logger } from "@/lib/observability/logger";
export function noteService() { return new NoteService(new PrismaNoteRepository(getPrisma()), logger.child({ module: "notes" })); }
