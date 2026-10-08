export type BibleSection =
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
  marketplaceApplication: string;
  practicalActionPlan: string[];
  duration: string;
  isGold: boolean;
  book: string;
  bibleSection: BibleSection;
  challenges: string[];
  publishedAt: string;
};

export type Collection = {
  slug: string;
  title: string;
  description: string;
  nuggetSlugs: string[];
};