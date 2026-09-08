"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  formatNumber,
  interpolateMessage,
  localizedErrorMessage,
} from "@/lib/i18n/messages";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import type {
  SearchReadModel,
  SearchResult,
} from "@/domains/search/domain/types";
import type { SearchEditorResultDetail } from "@/lib/search/editor-events";
import { SEARCH_EDITOR_RESULT } from "@/lib/search/editor-events";
import { SearchPeek } from "@/components/search/SearchPeek";
import { SearchResultGroups } from "@/components/search/SearchResultGroups";
import { ThemeMenu } from "./ThemeMenu";
import {
  MOBILE_WRITING_ACTION,
  type MobileWritingAction,
} from "@/lib/editor/mobile-actions";
import { recordClientOperationalEvent } from "@/lib/observability/client-operations";
import { markWritingInterruption } from "@/lib/observability/writing-session";
import {
  commandHref,
  matchesCommandShortcut,
  type CommandContext,
  type CommandId,
} from "@/lib/commands/registry";
import {
  availableCommands,
  captureCommandFocus,
  commandRevision,
  executeCommand,
  subscribeCommands,
} from "@/lib/commands/runtime";
import {
  rankPaletteItems,
  readCommandHistory,
  recordCommandUse,
} from "@/lib/commands/ranking";
import { modalControls } from "@/lib/editor/use-modal-keyboard";

type Envelope<T> = { data?: T; error?: { message: string } };
const navigate = (href: string) => window.location.assign(href);
const serverRevision = () => 0;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

function contextFromDocument(pathname: string | null): CommandContext {
  const node = document.querySelector<HTMLElement>("[data-search-project-id]");
  const routeProject =
    pathname?.match(/\/app\/projects\/([0-9a-f-]{36})/iu)?.[1] ?? null;
  const projectId = node?.dataset.searchProjectId ?? routeProject;
  const chapterId =
    node?.dataset.searchChapterId ??
    new URLSearchParams(window.location.search).get("returnChapterId");
  return {
    pathname: pathname ?? "",
    projectId: projectId && uuid.test(projectId) ? projectId : null,
    chapterId: chapterId && uuid.test(chapterId) ? chapterId : null,
  };
}

function emptyModel(projectId: string): SearchReadModel {
  return {
    projectId,
    projectStructuralVersion: 0,
    groups: [],
    providerStates: [],
    page: { returned: 0, total: 0, limit: 40, nextCursor: null },
    synchronized: {
      insertedOrUpdated: 0,
      removed: 0,
      sourceCount: 0,
      capped: false,
    },
  };
}

export function CommandPalette() {
  const { messages, locale } = useLocale();
  const pathname = usePathname();
  useSyncExternalStore(subscribeCommands, commandRevision, serverRevision);
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<CommandContext>({
    pathname: "",
    projectId: null,
    chapterId: null,
  });
  const [query, setQuery] = useState("");
  const [model, setModel] = useState<SearchReadModel | null>(null);
  const [peek, setPeek] = useState<SearchResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<(() => void) | null>(null);
  const peekOriginRef = useRef<HTMLElement | null>(null);
  const sequenceRef = useRef(0);

  const openPalette = useCallback(() => {
    if (open || document.querySelector('[aria-modal="true"]')) return;
    const nextContext = contextFromDocument(pathname);
    if (document.activeElement === document.body)
      triggerRef.current?.focus({ preventScroll: true });
    returnFocusRef.current = captureCommandFocus(nextContext);
    setContext(nextContext);
    markWritingInterruption("OPEN", "search");
    setOpen(true);
    setMessage(null);
    // Console trace S1-COMMAND-001: command palette opened; editor selection and content are excluded.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S1-COMMAND-001",
        event: "command_palette.opened",
      }),
    );
  }, [open, pathname]);

  const closePalette = useCallback(
    (afterRestore?: () => void, restore = true) => {
      sequenceRef.current += 1;
      setOpen(false);
      setQuery("");
      setModel(null);
      setPeek(null);
      setLoading(false);
      markWritingInterruption("CLOSE", "search");
      const returnFocus = returnFocusRef.current;
      requestAnimationFrame(() => {
        if (restore) returnFocus?.();
        afterRestore?.();
      });
      // Console trace S1-COMMAND-002: command palette closed and prior focus restoration was requested.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S1-COMMAND-002",
          event: "command_palette.closed",
        }),
      );
    },
    [],
  );

  const runCommand = useCallback(
    (id: CommandId) => {
      closePalette(() => {
        void executeCommand(id, context, navigate).then((ok) => {
          if (ok) recordCommandUse(context.projectId, `command:${id}`);
          else
            setMessage(
              messages.theCommandIsNoLongerAvailableNoSubstituteActionWasTaken,
            );
        });
      });
    },
    [
      closePalette,
      context,
      messages.theCommandIsNoLongerAvailableNoSubstituteActionWasTaken,
    ],
  );

  const closePeek = useCallback(() => {
    setPeek(null);
    requestAnimationFrame(() => {
      if (peekOriginRef.current?.isConnected) peekOriginRef.current.focus();
      else inputRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.keyCode === 229) return;
      if (matchesCommandShortcut(event, "command.palette")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (open) inputRef.current?.focus();
        else openPalette();
        return;
      }
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (peek) closePeek();
        else closePalette();
        return;
      }
      const shortcut = availableCommands(context).find((command) =>
        matchesCommandShortcut(event, command.id as CommandId),
      );
      if (shortcut) {
        event.preventDefault();
        event.stopImmediatePropagation();
        runCommand(shortcut.id as CommandId);
        return;
      }
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = modalControls(dialogRef.current);
        const first = focusable[0];
        const last = focusable.at(-1);
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            !dialogRef.current.contains(document.activeElement)) &&
          last
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !dialogRef.current.contains(document.activeElement)) &&
          first
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [closePalette, closePeek, context, open, openPalette, peek, runCommand]);

  useEffect(() => {
    const action = (event: Event) => {
      if ((event as CustomEvent<MobileWritingAction>).detail !== "search")
        return;
      openPalette();
      // Console trace S15-MOBILE-005: mobile Search open records the interaction source only.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S15-MOBILE-005",
          event: "responsive.search_opened",
          input: "touch",
        }),
      );
    };
    window.addEventListener(MOBILE_WRITING_ACTION, action);
    return () => window.removeEventListener(MOBILE_WRITING_ACTION, action);
  }, [openPalette]);

  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<SearchEditorResultDetail>).detail;
      setMessage(detail.message);
      if (detail.projectStructuralVersion)
        setModel((current) =>
          current
            ? {
                ...current,
                projectStructuralVersion: detail.projectStructuralVersion!,
              }
            : current,
        );
      if (open && detail.ok && detail.sourceKey) {
        recordCommandUse(context.projectId, detail.sourceKey);
        // A successful jump/reference owns its new cursor; do not restore the old palette snapshot over it.
        closePalette(undefined, false);
      }
    };
    window.addEventListener(SEARCH_EDITOR_RESULT, listener);
    return () => window.removeEventListener(SEARCH_EDITOR_RESULT, listener);
  }, [closePalette, context.projectId, open]);

  useEffect(() => {
    if (!open || !context.projectId || !query.trim()) return;
    const sequence = ++sequenceRef.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const startedAt = performance.now();
      setLoading(true);
      setMessage(null);
      try {
        const params = new URLSearchParams({ query, limit: "40" });
        if (context.chapterId) params.set("chapterId", context.chapterId);
        const response = await fetch(
          `/api/v2/projects/${context.projectId}/search?${params}`,
          { signal: controller.signal },
        );
        const envelope = (await response.json()) as Envelope<SearchReadModel>;
        if (!response.ok || !envelope.data)
          throw new Error(
            localizedErrorMessage(
              messages,
              envelope.error,
              messages.searchIsUnavailable,
            ),
          );
        if (controller.signal.aborted || sequence !== sequenceRef.current)
          return;
        setModel(envelope.data);
        const durationMs = Math.max(
          0,
          Math.round(performance.now() - startedAt),
        );
        recordClientOperationalEvent({
          projectId: context.projectId ?? undefined,
          eventName: "search.returned",
          durationMs,
          dimensions: { outcome: "success" },
          numericValue: envelope.data.page.returned,
        });
        // Console trace S16-FRICTION-004: Search-return timing records duration and result count without query or result content.
        console.log(
          JSON.stringify({
            level: "info",
            step: "S16-FRICTION-004",
            event: "friction.search_returned",
            projectId: context.projectId,
            durationMs,
            returned: envelope.data.page.returned,
          }),
        );
        // Console trace S10-UI-009: command palette search records counts/context presence only and excludes the query/results.
        console.log(
          JSON.stringify({
            level: "info",
            step: "S10-UI-009",
            event: "command_palette.search_resolved",
            projectId: context.projectId,
            hasChapterContext: Boolean(context.chapterId),
            returned: envelope.data.page.returned,
            groupCount: envelope.data.groups.length,
          }),
        );
      } catch (caught) {
        if (!controller.signal.aborted && sequence === sequenceRef.current)
          setMessage(
            caught instanceof Error
              ? caught.message
              : messages.searchIsUnavailable,
          );
      } finally {
        if (!controller.signal.aborted && sequence === sequenceRef.current)
          setLoading(false);
      }
    }, 160);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [context.chapterId, context.projectId, messages, open, query]);

  const openPeek = (result: SearchResult) => {
    peekOriginRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setPeek(result);
    recordCommandUse(context.projectId, result.sourceKey);
    // Console trace S10-UI-010: Search Peek records result identity and history length only; no authored content.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S10-UI-010",
        event: "search.peek_opened",
        projectId: context.projectId,
        sourceKey: result.sourceKey,
        historyLength: window.history.length,
      }),
    );
  };

  const moveToResult = (direction: 1 | -1) => {
    const options = [
      ...(dialogRef.current?.querySelectorAll<HTMLElement>(
        "[data-palette-option],button[data-search-option]",
      ) ?? []),
    ];
    if (!options.length) return;
    const current = options.indexOf(document.activeElement as HTMLElement);
    options[
      current < 0
        ? direction === 1
          ? 0
          : options.length - 1
        : (current + direction + options.length) % options.length
    ]?.focus();
  };
  const hasQuery = Boolean(query.trim());
  const items = rankPaletteItems(
    availableCommands(context),
    hasQuery ? (model?.groups.flatMap((group) => group.results) ?? []) : [],
    query,
    context,
    open ? readCommandHistory() : [],
    (command) => messages[command.labelKey],
  );
  return (
    <>
      <button
        ref={triggerRef}
        className="command-trigger"
        type="button"
        onClick={openPalette}
        aria-haspopup="dialog"
      >
        {messages.commands} <kbd>{messages.ctrlK}</kbd>
      </button>
      {!open && message ? (
        <span role="status" className="command-outcome">
          {message}
        </span>
      ) : null}
      {open ? (
        <div
          className="dialog-backdrop command-palette-backdrop"
          role="presentation"
          onMouseDown={() => closePalette()}
        >
          <section
            ref={dialogRef}
            className="command-dialog command-dialog-search"
            role="dialog"
            aria-modal="true"
            aria-labelledby="command-title"
            onMouseDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (
                event.nativeEvent.isComposing ||
                event.keyCode === 229 ||
                event.ctrlKey ||
                event.metaKey ||
                event.altKey ||
                event.shiftKey
              )
                return;
              if (
                event.target !== inputRef.current &&
                event.target instanceof Element &&
                event.target.closest(
                  'select,textarea,input,[contenteditable]:not([contenteditable="false"])',
                )
              )
                return;
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                moveToResult(event.key === "ArrowDown" ? 1 : -1);
              }
              if (event.key === "Enter" && event.target === inputRef.current) {
                event.preventDefault();
                dialogRef.current
                  ?.querySelector<HTMLElement>(
                    "[data-palette-option],button[data-search-option]",
                  )
                  ?.click();
              }
            }}
          >
            <header>
              <h2 id="command-title">{messages.commandPalette}</h2>
              <button type="button" onClick={() => closePalette()}>
                {messages.close}
              </button>
            </header>
            <label className="command-search">
              {messages.searchCommandsAndProjectObjects}
              <input
                ref={inputRef}
                autoFocus
                value={query}
                maxLength={160}
                onChange={(event) => {
                  sequenceRef.current += 1;
                  setQuery(event.target.value);
                  setModel(null);
                  setLoading(false);
                  setMessage(null);
                  setPeek(null);
                }}
              />
            </label>
            <ThemeMenu />
            <p role="status">
              {loading && hasQuery
                ? messages.searching
                : (message ??
                  (!context.projectId
                    ? messages.openAProjectToSearchProjectObjects
                    : hasQuery && model
                      ? interpolateMessage(messages.objectCount, {
                          count: formatNumber(locale, model.page.returned),
                        })
                      : messages.typeToSearchAllActiveProjectDomains))}
            </p>
            {peek ? (
              <SearchPeek result={peek} onClose={closePeek} />
            ) : (
              <SearchResultGroups
                model={model ?? emptyModel(context.projectId ?? "")}
                projectId={context.projectId ?? ""}
                chapterId={context.chapterId ?? undefined}
                onPeek={openPeek}
                onActionCompleted={(result) =>
                  recordCommandUse(context.projectId, result.sourceKey)
                }
                renderResults={(renderResult) => (
                  <ul
                    aria-label={messages.commandsAndProjectObjects}
                    className="command-results"
                  >
                    {items.map((item) => (
                      <li key={item.key} data-palette-key={item.key}>
                        {item.kind === "command" ? (
                          commandHref(item.command, context) ? (
                            <a
                              data-palette-option="true"
                              href={commandHref(item.command, context)!}
                              onClick={(event) => {
                                if (
                                  event.ctrlKey ||
                                  event.metaKey ||
                                  event.shiftKey ||
                                  event.altKey
                                ) {
                                  recordCommandUse(context.projectId, item.key);
                                  return;
                                }
                                event.preventDefault();
                                runCommand(item.command.id as CommandId);
                              }}
                            >
                              {messages[item.command.labelKey]}
                            </a>
                          ) : (
                            <button
                              type="button"
                              data-palette-option="true"
                              onClick={() =>
                                runCommand(item.command.id as CommandId)
                              }
                            >
                              {messages[item.command.labelKey]}
                              {item.command.shortcut ? (
                                <kbd>{item.command.shortcut}</kbd>
                              ) : null}
                            </button>
                          )
                        ) : (
                          renderResult(item.result)
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              />
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
