import { notesHttp } from "@/lib/notes/http";
import { noteService } from "@/lib/notes/runtime";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return notesHttp(request, "notes.list", (actor, requestId) => noteService().list(actor, id, Object.fromEntries(new URL(request.url).searchParams), requestId)); }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return notesHttp(request, "notes.write", async (actor, requestId) => noteService().write(actor, id, await request.json(), requestId), 201); }
