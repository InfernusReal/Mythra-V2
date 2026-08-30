"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor } from "@tiptap/react";
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
import { ConflictBanner } from "./ConflictBanner";
import { CausalComposer } from "./CausalComposer";
import { EditorCanvas } from "./EditorCanvas";
import { EditorToolbar } from "./EditorToolbar";
import { FocusMode } from "./FocusMode";
import { RecoveryDrawer } from "./RecoveryDrawer";
import { WordTarget } from "./WordTarget";
import { ContextualWritingField } from "@/components/context/ContextualWritingField";
import { QuickCaptureOverlay } from "@/components/capture/QuickCaptureOverlay";
import { EntityQuickCreate } from "@/components/universe/EntityQuickCreate";
import { EditorSearchBridge } from "@/components/language/EditorSearchBridge";
import { LiveModelFreshness } from "@/components/live-model/LiveModelFreshness";

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
    <div className={focusMode ? "editor-layout focus-mode" : "editor-layout"} data-search-project-id={model.project.id} data-search-chapter-id={model.chapter.id}>
      <header className="editor-header">
        <nav aria-label="Breadcrumb">
          <a href={`/app/projects/${model.project.id}`}>{model.project.title}</a><span>/</span><span>{model.chapter.title}</span>
        </nav>
        <FocusMode active={focusMode} onChange={changeFocusMode} />
      </header>
      <LiveModelFreshness projectId={model.project.id} />
      <div className="editor-structure-action"><a href={`/app/projects/${model.project.id}/structure`} onClick={() => {
        // Console trace S4-UI-015: editor-to-Structure navigation requested after continuation state capture remains active.
        console.log(JSON.stringify({ level: "info", step: "S4-UI-015", event: "structure.opened_from_editor", projectId: model.project.id, chapterId: model.chapter.id }));
      }}>Structure</a> <a href={`/app/projects/${model.project.id}/captures?returnChapterId=${model.chapter.id}`}>Capture Inbox</a></div>
      <QuickCaptureOverlay editor={editor} projectId={model.project.id} chapterId={model.chapter.id} />
      <EntityQuickCreate editor={editor} projectId={model.project.id} chapterId={model.chapter.id} />
      <EditorSearchBridge editor={editor} projectId={model.project.id} chapterId={model.chapter.id} hardStop={hardStop} />
      <ContextualWritingField editor={editor} projectId={model.project.id} chapterId={model.chapter.id} />
      <CausalComposer editor={editor} projectId={model.project.id} chapterId={model.chapter.id} />
      <nav className="chapter-switcher" aria-label="Nearby chapters">
        {model.navigation.previousChapterId ? <a href={`/app/chapters/${model.navigation.previousChapterId}`}>Previous chapter</a> : <span>First chapter</span>}
        {model.navigation.nextChapterId ? <a href={`/app/chapters/${model.navigation.nextChapterId}`}>Next chapter</a> : <span>Latest chapter</span>}
      </nav>
      <EditorToolbar editor={editor} onCheckpoint={() => void durability.checkpoint()} />
      <EditorCanvas editor={editor} />
      {hardStopMessage ? <p className="editor-limit" role="alert">{hardStopMessage}</p> : null}
      {durability.recoveryNotice ? <RecoveryDrawer chapterId={model.chapter.id} notice={durability.recoveryNotice} onDismiss={durability.dismissRecovery} /> : null}
      {durability.conflict ? <ConflictBanner conflict={durability.conflict} compareOpen={durability.compareOpen} onCompare={() => durability.setCompareOpen(!durability.compareOpen)} onResolve={(resolution) => void durability.resolveConflict(resolution)} /> : null}
      <footer className="editor-status" role="status">
        <WordTarget wordCount={wordCount} delta={delta} />
        <span>Autosave on</span>
      </footer>
    </div>
  );
}
