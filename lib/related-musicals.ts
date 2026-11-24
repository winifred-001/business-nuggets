/** Select the first four actual musicals matching the current topic or Bible book, in archive order. */
export type RelatedMusical = {
  slug: string;
  topic: string;
  book: string;
  audioUrl?: string | null;
  musicalAudioUrl?: string | null;
};

export function selectRelatedMusicals<T extends RelatedMusical>(
  current: RelatedMusical,
  nuggets: T[],
): T[] {
  const topic = current.topic.trim().toLowerCase();
  const book = current.book.trim().toLowerCase();
  return nuggets.filter(item =>
    item.slug !== current.slug &&
    ((Boolean(topic) && item.topic.trim().toLowerCase() === topic) ||
      (Boolean(book) && item.book.trim().toLowerCase() === book)) &&
    Boolean(item.musicalAudioUrl?.trim() || item.audioUrl?.trim())
  ).slice(0, 4);
}
