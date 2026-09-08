"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";

import type { Editor } from "@tiptap/core";

export function EditorToolbar({
  editor,
  onCheckpoint,
}: {
  editor: Editor | null;
  onCheckpoint(): void;
}) {
  const { messages } = useLocale();
  return (
    <div
      className="editor-toolbar"
      role="toolbar"
      aria-label={messages.textFormatting}
    >
      <button
        onClick={() => editor?.chain().focus().toggleBold().run()}
        aria-pressed={editor?.isActive("bold")}
      >
        {messages.bold}
      </button>
      <button
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        aria-pressed={editor?.isActive("italic")}
      >
        {messages.italic}
      </button>
      <button onClick={() => editor?.chain().focus().undo().run()}>
        {messages.undo}
      </button>
      <button onClick={() => editor?.chain().focus().redo().run()}>
        {messages.redo}
      </button>
      <button onClick={onCheckpoint}>{messages.checkpoint}</button>
    </div>
  );
}
