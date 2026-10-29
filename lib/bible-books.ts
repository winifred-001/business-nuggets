// Complete Bible book list, shared by both Nugget admin forms.
export const BIBLE_BOOKS: readonly string[] = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalms",
  "Proverbs",
  "Ecclesiastes",
  "Song of Solomon",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation",
];

export const BIBLE_GROUPS = [
  { name: "The Pentateuch", books: BIBLE_BOOKS.slice(0, 5) },
  { name: "History & Leadership", books: BIBLE_BOOKS.slice(5, 17) },
  { name: "Wisdom Literature", books: BIBLE_BOOKS.slice(17, 22) },
  { name: "Major Prophets", books: BIBLE_BOOKS.slice(22, 27) },
  { name: "Minor Prophets", books: BIBLE_BOOKS.slice(27, 39) },
  { name: "Gospels", books: BIBLE_BOOKS.slice(39, 43) },
  { name: "Acts & Early Church", books: BIBLE_BOOKS.slice(43, 44) },
  { name: "Pauline Epistles", books: BIBLE_BOOKS.slice(44, 57) },
  { name: "General Epistles", books: BIBLE_BOOKS.slice(57, 65) },
  { name: "Revelation", books: BIBLE_BOOKS.slice(65) },
] as const;

export type BibleGroup = (typeof BIBLE_GROUPS)[number]["name"];

export function canonicalBibleBook(value: string): string | undefined {
  const key = value.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
  const aliases: Record<string, string> = { psalm: "Psalms", "song of songs": "Song of Solomon" };
  return aliases[key] || BIBLE_BOOKS.find(book => book.toLowerCase() === key);
}

export function bibleBookFromReference(reference: string): string | undefined {
  const text = reference.trim().toLowerCase();
  const names = [...BIBLE_BOOKS, "Psalm", "Song of Songs"].sort((a, b) => b.length - a.length);
  return canonicalBibleBook(names.find(name => text === name.toLowerCase() || new RegExp(`^${name}\\s+\\d`, "i").test(text)) || "");
}

export function bibleGroupForBook(book: string): BibleGroup | undefined {
  const canonical = canonicalBibleBook(book);
  return BIBLE_GROUPS.find(group => group.books.includes(canonical || ""))?.name;
}

/** Derive groups for existing records without rewriting stored teaching content. */
export function withBibleGroup<T extends { book: string; scriptureRef: string; bibleSection: string }>(nugget: T): T {
  const book = bibleBookFromReference(nugget.scriptureRef || "") || canonicalBibleBook(nugget.book || "") || nugget.book;
  return { ...nugget, book, bibleSection: bibleGroupForBook(book) || nugget.bibleSection };
}

/** Keep a recognized reference aligned when an editor changes its book. */
export function referenceWithBook(book: string, reference: string): string {
  if (!canonicalBibleBook(book) || !bibleBookFromReference(reference)) return reference;
  const verses = reference.trim().match(/\s+(\d.*)$/)?.[1];
  return `${book}${verses ? ` ${verses}` : ""}`;
}
