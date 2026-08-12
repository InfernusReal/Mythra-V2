"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Extension, Mark, mergeAttributes } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import Heading from "@tiptap/extension-heading";
import Paragraph from "@tiptap/extension-paragraph";
import StarterKit from "@tiptap/starter-kit";
import type { ChapterEditorReadModel } from "@/domains/writing/application/ports";
import { deriveChapterText, exceedsExplicitHardStop, wordTargetDelta } from "@/domains/writing/domain/chapter-document";
import type { DurabilityController } from "@/lib/writing/use-durable-chapter";
import { useDurableChapter } from "@/lib/writing/use-durable-chapter";
import { tiptapAdapter } from "@/lib/editor/adapter";
import type { WritingPosition } from "@/domains/writing/application/continuation-ports";
import { useWritingContinuation } from "@/lib/writing/use-writing-continuation";

const BlockParagraph = Paragraph.extend({
  addAttributes() {
    return {
      blockId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-block-id"),
        renderHTML: (attributes) => ({ "data-block-id": attributes.blockId ?? crypto.randomUUID() })
      }
    };
  }
});

const BlockHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      blockId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-block-id"),
        renderHTML: (attributes) => ({ "data-block-id": attributes.blockId ?? crypto.randomUUID() })
      }
    };
  }
});

const StoryReference = Mark.create({
  name: "storyReference",
  addAttributes() {
    return { referenceId: {}, referenceType: {} };
  },
  parseHTML() {
    return [{ tag: "span[data-story-reference]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-story-reference": "true" }), 0];
  }
});

const StableBlockIds = Extension.create({
  name: "stableBlockIds",
  addProseMirrorPlugins() {
    return [new Plugin({
      appendTransaction(transactions, _oldState, newState) {
        if (!transactions.some((transaction) => transaction.docChanged)) return null;
        const seen = new Set<string>();
        const transaction = newState.tr;
        let repaired = 0;
        newState.doc.descendants((node, position) => {
          if (node.type.name !== "paragraph" && node.type.name !== "heading") return true;
          const current = typeof node.attrs.blockId === "string" ? node.attrs.blockId : null;
          if (!current || seen.has(current)) {
            const blockId = crypto.randomUUID();
            transaction.setNodeMarkup(position, undefined, { ...node.attrs, blockId });
            seen.add(blockId);
            repaired += 1;
          } else seen.add(current);
          return false;
        });
        if (!repaired) return null;
        // Console trace S3-BLOCK-001: missing/duplicate block anchors were repaired before document emission; prose is excluded.
        console.log(JSON.stringify({ level: "info", step: "S3-BLOCK-001", event: "continuation.block_anchors_repaired", repairedBlockCount: repaired }));
        return transaction;
      }
    })];
  }
});

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/u).length : 0;
}

export function ChapterEditor({ model, initialSession }: { model: ChapterEditorReadModel; initialSession: WritingPosition }) {
  const [focusMode, setFocusMode] = useState(false);
  const [wordCount, setWordCount] = useState(model.chapter.wordCount);
  const [hardStopMessage, setHardStopMessage] = useState<string | null>(null);
  const hardStop = model.chapter.hardStopEnabled ? model.chapter.hardCharacterStop : null;
  const durabilityRef = useRef<DurabilityController | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ paragraph: false, heading: false }),
      BlockParagraph,
      BlockHeading,
      StoryReference,
      StableBlockIds
    ],
    content: tiptapAdapter.toEngine(model.chapter.document),
    onCreate: () => {
      // Console trace S1-EDITOR-CLIENT-001: local editor initialized; document content is excluded.
      console.log(JSON.stringify({ level: "info", step: "S1-EDITOR-CLIENT-001", event: "editor.local_ready", chapterId: model.chapter.id, version: model.chapter.version }));
    },
    onUpdate: ({ editor: instance }) => {
      const nextWordCount = countWords(instance.getText());
      setWordCount(nextWordCount);
      setHardStopMessage(null);
      durabilityRef.current?.onDocumentChange(tiptapAdapter.fromEngine(instance.getJSON()));
      // Console trace S1-EDITOR-CLIENT-002: local document state changed; only counts are emitted.
      console.log(JSON.stringify({ level: "info", step: "S1-EDITOR-CLIENT-002", event: "editor.local_changed", chapterId: model.chapter.id, wordCount: nextWordCount, characterCount: instance.state.doc.textContent.length }));
    },
    editorProps: {
      attributes: { class: "editor-prose", role: "textbox", "aria-label": "Chapter manuscript", "aria-multiline": "true" },
      handleTextInput(view, from, to, text) {
        if (!hardStop) return false;
        const selectedLength = view.state.doc.textBetween(from, to).length;
        if (!exceedsExplicitHardStop(view.state.doc.textContent.length, selectedLength, text.length, hardStop)) return false;
        setHardStopMessage(`The explicit ${hardStop}-character limit is reached.`);
        // Console trace S1-EDITOR-CLIENT-004: explicit hard stop rejected input; prose is excluded.
        console.log(JSON.stringify({ level: "info", step: "S1-EDITOR-CLIENT-004", event: "editor.hard_stop_reached", chapterId: model.chapter.id, hardStop }));
        return true;
      },
      handlePaste(view, event) {
        if (!hardStop) return false;
        const text = event.clipboardData?.getData("text/plain") ?? "";
        const { from, to } = view.state.selection;
        const selectedLength = view.state.doc.textBetween(from, to).length;
        if (!exceedsExplicitHardStop(view.state.doc.textContent.length, selectedLength, text.length, hardStop)) return false;
        setHardStopMessage(`The explicit ${hardStop}-character limit is reached.`);
        // Console trace S1-EDITOR-CLIENT-005: explicit hard stop rejected paste; clipboard and prose are excluded.
        console.log(JSON.stringify({ level: "info", step: "S1-EDITOR-CLIENT-005", event: "editor.hard_stop_paste_rejected", chapterId: model.chapter.id, hardStop }));
        return true;
      }
    }
  });

  const durability = useDurableChapter({
    chapterId: model.chapter.id,
    initialDocument: model.chapter.document,
    initialVersion: model.chapter.version,
    applyDocument: (document) => {
      editor?.commands.setContent(tiptapAdapter.toEngine(document), { emitUpdate: false });
      setWordCount(deriveChapterText(document).wordCount);
    }
  });
  useEffect(() => {
    durabilityRef.current = durability;
  }, [durability]);
  useWritingContinuation({ editor, durableReady: durability.ready, projectId: model.project.id, chapterId: model.chapter.id, initialSession });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setFocusMode((value) => {
          const next = !value;
          // Console trace S1-EDITOR-CLIENT-006: keyboard Focus toggle executed without logging editor content.
          console.log(JSON.stringify({ level: "info", step: "S1-EDITOR-CLIENT-006", event: "editor.focus_keyboard_toggled", chapterId: model.chapter.id, enabled: next }));
          return next;
        });
      }
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void durabilityRef.current?.checkpoint();
      }
      if (event.key === "Escape" && focusMode) {
        setFocusMode(false);
        requestAnimationFrame(() => editor?.commands.focus());
        // Console trace S1-EDITOR-CLIENT-007: Escape requested focus restoration to the manuscript.
        console.log(JSON.stringify({ level: "info", step: "S1-EDITOR-CLIENT-007", event: "editor.focus_restoration_requested", chapterId: model.chapter.id }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor, focusMode, model.chapter.id]);

  const changeFocusMode = () => {
    setFocusMode((value) => {
      const next = !value;
      // Console trace S1-EDITOR-CLIENT-003: Focus mode changed without logging editor content.
      console.log(JSON.stringify({ level: "info", step: "S1-EDITOR-CLIENT-003", event: "editor.focus_mode_changed", chapterId: model.chapter.id, enabled: next }));
      return next;
    });
  };
  const delta = wordTargetDelta(wordCount, model.chapter.targetWords);

  return (
    <div className={focusMode ? "editor-layout focus-mode" : "editor-layout"}>
      <header className="editor-header">
        <nav aria-label="Breadcrumb">
          <a href={`/app/projects/${model.project.id}`}>{model.project.title}</a><span>/</span><span>{model.chapter.title}</span>
        </nav>
        <button onClick={changeFocusMode} aria-pressed={focusMode}>Focus</button>
      </header>
      <nav className="chapter-switcher" aria-label="Nearby chapters">
        {model.navigation.previousChapterId ? <a href={`/app/chapters/${model.navigation.previousChapterId}`}>Previous chapter</a> : <span>First chapter</span>}
        {model.navigation.nextChapterId ? <a href={`/app/chapters/${model.navigation.nextChapterId}`}>Next chapter</a> : <span>Latest chapter</span>}
      </nav>
      <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
        <button onClick={() => editor?.chain().focus().toggleBold().run()} aria-pressed={editor?.isActive("bold")}>Bold</button>
        <button onClick={() => editor?.chain().focus().toggleItalic().run()} aria-pressed={editor?.isActive("italic")}>Italic</button>
        <button onClick={() => editor?.chain().focus().undo().run()}>Undo</button>
        <button onClick={() => editor?.chain().focus().redo().run()}>Redo</button>
        <button onClick={() => void durability.checkpoint()}>Checkpoint</button>
      </div>
      <EditorContent editor={editor} />
      {hardStopMessage ? <p className="editor-limit" role="alert">{hardStopMessage}</p> : null}
      {durability.conflict ? (
        <section className="conflict-banner" aria-labelledby="conflict-title">
          <h2 id="conflict-title">Two versions need your choice</h2>
          <p>Your local draft and the saved version are both preserved.</p>
          <div className="conflict-actions">
            <button onClick={() => durability.setCompareOpen(!durability.compareOpen)}>Compare</button>
            <button onClick={() => void durability.resolveConflict("KEEP_LOCAL")}>Keep local as new version</button>
            <button onClick={() => void durability.resolveConflict("KEEP_SERVER")}>Keep server</button>
            <button onClick={() => void durability.resolveConflict("DUPLICATE_RECOVERY")}>Duplicate as recovery copy</button>
          </div>
          {durability.compareOpen ? (
            <div className="revision-compare">
              <article><h3>Local draft</h3><pre>{deriveChapterText(durability.conflict.localDocument).plainText}</pre></article>
              <article><h3>Saved version</h3><pre>{deriveChapterText(durability.conflict.serverDocument).plainText}</pre></article>
            </div>
          ) : null}
        </section>
      ) : null}
      <footer className="editor-status" role="status">
        <span>{wordCount} words</span>
        {delta !== null ? <span>{delta >= 0 ? `${delta} remaining` : `${Math.abs(delta)} over target`}</span> : <span>No target</span>}
        <span>Autosave on</span>
      </footer>
    </div>
  );
}
