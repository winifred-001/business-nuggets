/** Supported text formatting only; the result is always rendered as escaped text. */
export function nuggetText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p\s*>\s*<p\s*>/gi, "\n\n")
    .replace(/<\/?p\s*>/gi, "")
    .trim();
}

export function nuggetExcerpt(value: string) {
  return nuggetText(value).replace(/\s+/g, " ").trim();
}
