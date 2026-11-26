/**
 * Remove the hierarchy reference code only from incoming Topic labels.
 *
 * Applies to bulk-import Topic.name and Nugget.topic, NOT Nugget.title,
 * Nugget.number, Category.name, routes, or previously saved records.
 * "B01T01 Business Calling and Purpose" => "Business Calling and Purpose".
 */
export function normalizeImportedTopicName(input: string): string {
  const normalized = input.replace(
    /^\s*B\d{2,3}T\d{2,3}(?:\s*[-–—:.)]\s*|\s+)(?=\S)/i,
    '',
  ).trim();
  return normalized || input.trim();
}
