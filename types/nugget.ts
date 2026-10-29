import type { BibleGroup } from "@/lib/bible-books";

export type BibleSection = BibleGroup
  | "The Pentateuch"
  | "History & Leadership"
  | "Wisdom Literature"
  | "The Prophets"
  | "New Testament";

export type Nugget = {
  id: string;
  slug: string;
  number: number;
  title: string;
  topic: string;
  tag: string;
  scriptureRef: string;
  scriptureText: string;
  image: string;
  keyPrinciple: string;
  details?: string | null;
  marketplaceApplication: string;
  practicalActionPlan: string[];
  duration: string;
  isGold: boolean;
  locked?: boolean;
  book: string;
  bibleSection: BibleSection;
  challenges: string[];
  audioUrl?: string | null;
  nuggetAudioUrl?: string | null;
  publishedAt: string;
};

export type Collection = {
  slug: string;
  title: string;
  description: string;
  nuggetSlugs: string[];
};