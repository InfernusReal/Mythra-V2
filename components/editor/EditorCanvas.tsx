"use client";

import { EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";

export function EditorCanvas({ editor }: { editor: Editor | null }) {
  return <EditorContent className="editor-canvas" editor={editor} />;
}
