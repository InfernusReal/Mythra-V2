"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type UIEvent,
} from "react";
import { virtualWindow } from "@/lib/performance/virtual-window";
import { formatNumber } from "@/lib/i18n/messages";

export function VirtualList<T>({
  items,
  getKey,
  renderItem,
  label,
  className,
  rowHeight = 144,
  viewportHeight = 480,
}: {
  items: readonly T[];
  getKey(item: T): string;
  renderItem(item: T, index: number): ReactNode;
  label: string;
  className?: string;
  rowHeight?: number;
  viewportHeight?: number;
}) {
  const { messages, locale } = useLocale();
  const [scrollTop, setScrollTop] = useState(0);
  const window = useMemo(
    () =>
      virtualWindow({
        itemCount: items.length,
        rowHeight,
        viewportHeight,
        scrollTop,
      }),
    [items.length, rowHeight, scrollTop, viewportHeight],
  );
  useEffect(() => {
    // Console trace S15-VIRTUAL-001: bounded list activation records item/render counts and dimensions only.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S15-VIRTUAL-001",
        event: "performance.virtual_list_activated",
        itemCount: items.length,
        renderedCount: window.rendered,
        rowHeight,
        viewportHeight,
      }),
    );
  }, [items.length, rowHeight, viewportHeight, window.rendered]);
  const onScroll = (event: UIEvent<HTMLDivElement>) =>
    setScrollTop(event.currentTarget.scrollTop);
  return (
    <div
      className="virtual-list-viewport"
      style={{ height: viewportHeight }}
      onScroll={onScroll}
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      <ol
        className={className}
        style={{ height: window.totalHeight, position: "relative" }}
      >
        {items.slice(window.start, window.end).map((item, relativeIndex) => {
          const index = window.start + relativeIndex;
          return (
            <li
              key={getKey(item)}
              aria-posinset={index + 1}
              aria-setsize={items.length}
              style={{
                position: "absolute",
                insetInline: 0,
                top: index * rowHeight,
                minHeight: rowHeight,
              }}
            >
              {renderItem(item, index)}
            </li>
          );
        })}
      </ol>
      <span className="sr-only" aria-live="polite">
        {messages.showingItems}{" "}
        {formatNumber(locale, items.length ? window.start + 1 : 0)}{" "}
        {messages.through} {formatNumber(locale, window.end)} {messages.of}{" "}
        {formatNumber(locale, items.length)}
      </span>
    </div>
  );
}
