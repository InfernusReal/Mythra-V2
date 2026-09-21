import { notesHttp } from "@/lib/notes/http";
import { noteService } from "@/lib/notes/runtime";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return notesHttp(request, "notes.promote", async (actor, requestId) => noteService().promote(actor, id, await request.json(), requestId), 201); }
