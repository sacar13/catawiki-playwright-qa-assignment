import type { Locator } from '@playwright/test';

/** Cards within this many pixels of each other vertically are considered the same row. */
const DEFAULT_ROW_TOLERANCE_PX = 40;

/**
 * Resolves the DOM index of the element at a given position in visual reading order
 * (top to bottom, then left to right), rather than DOM order.
 *
 * CSS grid and flex layouts can reorder elements visually without changing their DOM order,
 * so treating "the Nth visible item" as "the Nth DOM match" (`locator.nth(n)`) is unsafe on
 * any page whose layout is not a simple single-column list. All bounding boxes are measured
 * in a single round trip; measuring each element separately costs one browser call per
 * element and dominates the runtime on pages with many items.
 */
export async function resolveVisualOrderIndex(
  locator: Locator,
  visualPosition: number,
  rowTolerancePx: number = DEFAULT_ROW_TOLERANCE_PX,
): Promise<number> {
  const positioned = await locator.evaluateAll(
    (elements, tolerance) =>
      elements
        .map((element, index) => {
          const rect = element.getBoundingClientRect();
          return {
            index,
            row: Math.round((rect.top + window.scrollY) / tolerance),
            left: rect.left + window.scrollX,
            rendered: rect.width > 0 && rect.height > 0,
          };
        })
        .filter((entry) => entry.rendered),
    rowTolerancePx,
  );

  positioned.sort((a, b) => a.row - b.row || a.left - b.left);

  const resolved = positioned[visualPosition];
  if (!resolved) {
    throw new Error(
      `No element at visual position ${String(visualPosition)} (found ${String(positioned.length)} positioned elements).`,
    );
  }

  return resolved.index;
}
