/**
 * Page-number strip for the Wisdom Library.
 * Show at most 15 consecutive pages around the current position, followed by
 * the final two pages. Move the strip forward as the user navigates.
 * "ellipsis" is presentational only; existing page navigation remains unchanged.
 */
export function libraryPageNumbers(totalPages: number, currentPage: number): Array<number | "ellipsis"> {
  const total = Math.max(1, Math.floor(totalPages));
  const current = Math.min(total, Math.max(1, Math.floor(currentPage)));
  const windowSize = 15;
  const pinnedEndCount = 2;

  if (total <= windowSize + pinnedEndCount) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  // Never scroll the active page out of the visible range.
  const start = Math.min(current, total - windowSize - pinnedEndCount + 1);
  const pages: Array<number | "ellipsis"> = Array.from(
    { length: windowSize },
    (_, index) => start + index,
  );
  const tail = [total - 1, total];

  const gap = tail[0] - (start + windowSize - 1) - 1;
  if (gap > 1) {
    pages.push("ellipsis");
  } else if (gap === 1) {
    pages.push(tail[0] - 1);
  }
  return [...pages, ...tail];
}
