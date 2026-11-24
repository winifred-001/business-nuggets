/** Select the first four actual musicals in the current core topic, in archive order. */
export type RelatedMusical = {
  slug: string;
  topic: string;
  audioUrl?: string | null;
  musicalAudioUrl?: string | null;
};

export function selectRelatedMusicals<T extends RelatedMusical>(
  current: RelatedMusical,
  nuggets: T[],
): T[] {
  const topic = current.topic.trim().toLowerCase();
  if (!topic) return [];
  return nuggets.filter(item =>
    item.slug !== current.slug &&
    item.topic.trim().toLowerCase() === topic &&
    Boolean(item.musicalAudioUrl?.trim() || item.audioUrl?.trim())
  ).slice(0, 4);
}
