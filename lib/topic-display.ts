/**
 * Hide imported hierarchy identifiers from visible Topic labels only.
 * This MUST NOT be applied to stored topic names, matching, filter values,
 * followed-topic identifiers, or URL slugs.
 *
 * Examples: "B01T01 Business Calling and Purpose" -> "Business Calling and Purpose"
 */
export function displayTopicName(name: string): string {
  const cleaned = name.replace(
    /^\s*B\d{2,3}T\d{2,3}(?:\s*[-–—:.)]\s*|\s+)(?=\S)/i,
    "",
  ).replace(/^\s*\d{1,4}(?:[.)](?:\s+|(?=[A-Za-z]))|\s*[-–—:]\s*|(?<=\b0\d)\s+)(?=\S)/, "").trim();
  return cleaned || name;
}
