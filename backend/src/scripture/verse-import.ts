import { BadRequestException } from '@nestjs/common';
import { parseCsvRecords } from '../topics/topics-csv';
import { BIBLE_CHAPTERS, canonicalBook } from './bible-books';

export type ScriptureVerse = { book: string; chapter: number; verse: number; translation: string; text: string };
export const verseKey = (row: ScriptureVerse) => `${row.book}|${row.chapter}|${row.verse}|${row.translation}`;
export function parseVerses(csv: string): (ScriptureVerse & { row: number })[] {
  const records = parseCsvRecords(csv);
  const aliases: Record<string, string> = { book: 'book', biblebook: 'book', chapter: 'chapter', verse: 'verse', text: 'text', versetext: 'text', scripturetext: 'text', translation: 'translation', version: 'translation' };
  const headers = records.shift()!.fields.map(h => aliases[h.toLowerCase().replace(/[^a-z]/g, '')]);
  if (headers.some(h => !h) || new Set(headers).size !== headers.length || !['book', 'chapter', 'verse', 'text'].every(h => headers.includes(h)))
    throw new BadRequestException('Use book,chapter,verse,text and optional translation columns.');
  const seen = new Set<string>();
  return records.map(record => {
    const fail = (message: string): never => { throw new BadRequestException(`Row ${record.line}: ${message}`); };
    if (record.fields.length !== headers.length) fail('Fields do not match the header.');
    const value = Object.fromEntries(headers.map((h, i) => [h, record.fields[i]]));
    const book = canonicalBook(value.book);
    if (!book) fail('Use a full Bible book name from the 66-book list.');
    const chapter = Number(value.chapter), verse = Number(value.verse);
    if (!/^\d+$/.test(value.chapter) || !Number.isInteger(chapter) || chapter < 1 || chapter > BIBLE_CHAPTERS[book!]) fail(`Chapter must be between 1 and ${BIBLE_CHAPTERS[book!]}.`);
    if (!/^\d+$/.test(value.verse) || !Number.isInteger(verse) || verse < 1 || verse > 176) fail('Verse must be a whole number between 1 and 176.');
    const text = value.text.trim(), translation = (value.translation || 'KJV').trim().toUpperCase();
    if (!text || text.length > 10000) fail('Verse text must contain 1–10,000 characters.');
    if (!/^[A-Z0-9][A-Z0-9 ._-]{0,29}$/.test(translation)) fail('Translation must be a short name such as KJV.');
    const result = { book: book!, chapter, verse, text, translation, row: record.line };
    const key = verseKey(result);
    if (seen.has(key)) fail('Duplicate book, chapter, verse and translation in this file.');
    seen.add(key);
    return result;
  });
}
export function planVerseImport(incoming: ReturnType<typeof parseVerses>, existing: ScriptureVerse[]) {
  const byKey = new Map(existing.map(row => [verseKey(row), row]));
  const rows = incoming.map(row => {
    const current = byKey.get(verseKey(row));
    if (current && current.text !== row.text) throw new BadRequestException(`Row ${row.row}: ${row.book} ${row.chapter}:${row.verse} (${row.translation}) already has different text. Nothing was imported.`);
    return { ...row, action: current ? 'skip' as const : 'create' as const };
  });
  return { rows, versesToCreate: rows.filter(r => r.action === 'create').length, skipped: rows.filter(r => r.action === 'skip').length };
}
