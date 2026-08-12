"use client";

import type { Editor } from "@tiptap/core";

export function EditorToolbar({ editor, onCheckpoint }: { editor: Editor | null; onCheckpoint(): void }) {
  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
      <button onClick={() => editor?.chain().focus().toggleBold().run()} aria-pressed={editor?.isActive("bold")}>Bold</button>
      <button onClick={() => editor?.chain().focus().toggleItalic().run()} aria-pressed={editor?.isActive("italic")}>Italic</button>
      <button onClick={() => editor?.chain().focus().undo().run()}>Undo</button>
      <button onClick={() => editor?.chain().focus().redo().run()}>Redo</button>
      <button onClick={onCheckpoint}>Checkpoint</button>
    </div>
  );
}
