import { performanceBudgets } from "./budgets";

export interface VirtualWindow {
  start: number;
  end: number;
  offsetTop: number;
  totalHeight: number;
  rendered: number;
}

export function virtualWindow(input: { itemCount: number; rowHeight: number; viewportHeight: number; scrollTop: number; overscan?: number }): VirtualWindow {
  const itemCount = Math.max(0, Math.floor(input.itemCount));
  const rowHeight = Math.max(1, Math.floor(input.rowHeight));
  const viewportHeight = Math.max(rowHeight, Math.floor(input.viewportHeight));
  const overscan = Math.max(0, Math.min(20, Math.floor(input.overscan ?? 4)));
  const visibleCount = Math.ceil(viewportHeight / rowHeight);
  const targetCount = Math.min(performanceBudgets.maxRenderedListItems, visibleCount + overscan * 2);
  const unclampedStart = Math.floor(Math.max(0, input.scrollTop) / rowHeight) - overscan;
  const start = Math.max(0, Math.min(Math.max(0, itemCount - targetCount), unclampedStart));
  const end = Math.min(itemCount, start + targetCount);
  return { start, end, offsetTop: start * rowHeight, totalHeight: itemCount * rowHeight, rendered: end - start };
}
