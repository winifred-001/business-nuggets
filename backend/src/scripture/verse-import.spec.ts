import 'reflect-metadata';
import { Workbook } from 'exceljs';
import { ValidationPipe } from '@nestjs/common';
import { csvCell, readImportFile } from '../imports/import-file';
import { ImportTicketDto, issueImportTicket, verifyImportTicket } from '../imports/import-ticket';
import { BIBLE_CHAPTERS } from './bible-books';
import { parseVerses, planVerseImport, verseKey } from './verse-import';
import { ScriptureVersesService } from './scripture-verses.service';
import { db } from '../prisma/db';

jest.mock('../prisma/db', () => {
  type Row = { book: string; chapter: number; verse: number; translation: string; text: string };
  let verses: Row[] = [];
  let books: { name: string }[] = [];
  const key = (r: Row) => `${r.book}|${r.chapter}|${r.verse}|${r.translation}`;
  const query = jest.fn(async (plan: { sql: string; values: unknown[] }) => {
    if (plan.sql.includes('pg_advisory')) return [{ locked: 1 }];
    if (plan.sql.includes('INSERT INTO')) {
      const rows: Row[] = JSON.parse(String(plan.values[0]));
      const additions = rows.filter(r => !verses.some(v => key(v) === key(r)));
      verses.push(...additions.map(({ book, chapter, verse, translation, text }) => ({ book, chapter, verse, translation, text })));
      return additions.map(r => ({ book: r.book }));
    }
    if (plan.sql.includes('count(*)')) return [...new Set(verses.map(r => r.book))].map(book => ({ book, count: verses.filter(r => r.book === book).length }));
    if (plan.sql.includes('JOIN jsonb')) {
      const keys = JSON.parse(String(plan.values[0])).map(key);
      return verses.filter(r => keys.includes(key(r)));
    }
    if (plan.sql.includes('SELECT *')) return verses.filter(r => !plan.sql.includes('WHERE') || r.book === plan.values[0]).slice(0,50);
    throw new Error('Unhandled verse query: '+plan.sql);
  });
  const orm = { public: { ScriptureBook: { all: async () => books, create: jest.fn(async (row: { name: string }) => { books.push(row); return row; }) } } };
  return { db: {
    raw: { sql: (strings: TemplateStringsArray, ...values: unknown[]) => { const plan = { sql: strings.join('?'), values }; return { affectedCount: () => ({ build: () => plan }), returnsRow: () => ({ build: () => plan }) }; } },
    runtime: () => ({ execute: async () => 0, query }), orm,
    transaction: async (run: (tx: unknown) => Promise<unknown>) => { const oldVerses = [...verses], oldBooks = [...books]; try { return await run({ query, orm }); } catch (e) { verses = oldVerses; books = oldBooks; throw e; } },
  } };
});
const rows = [{ book: 'Genesis', chapter: 1, verse: 1, text: 'In the beginning, God created.\nA second line.', translation: 'KJV' }];
const csv = (input: object[]) => { const list = input as Record<string, unknown>[], headers = [...new Set(list.flatMap(Object.keys))]; return [headers.map(csvCell).join(','), ...list.map(row => headers.map(h => csvCell(row[h] ?? '')).join(','))].join('\n'); };
describe('Scripture verse imports', () => {
  it.each(['csv','json','xlsx'])('accepts %s and preserves text punctuation and newlines', async format => {
    let buffer: Buffer;
    if (format === 'xlsx') { const w = new Workbook(), s = w.addWorksheet('Verses'); s.addRow(Object.keys(rows[0])); s.addRow(Object.values(rows[0])); buffer = Buffer.from(await w.xlsx.writeBuffer()); }
    else buffer = Buffer.from(format === 'json' ? JSON.stringify(rows) : csv(rows));
    const parsed = parseVerses(await readImportFile({ buffer, originalname: `verses.${format}` } as Express.Multer.File));
    expect(parsed[0]).toMatchObject(rows[0]);
  });
  it('supports all 66 books, normalizes names, and defaults translation to KJV', () => {
    expect(Object.keys(BIBLE_CHAPTERS)).toHaveLength(66);
    expect(parseVerses(csv([{book:'Psalm',chapter:150,verse:1,text:'Text'}]))[0]).toMatchObject({book:'Psalms',translation:'KJV'});
    expect(parseVerses(csv([{book:'song of songs',chapter:8,verse:1,text:'Text'}]))[0].book).toBe('Song of Solomon');
  });
  it('rejects invalid books, chapter numbers, empty text, unknown columns and duplicate references', () => {
    for (const change of [{book:'Unknown'},{chapter:51},{chapter:0},{verse:1.5},{verse:0},{text:''},{extra:'unknown'}]) expect(() => parseVerses(csv([{...rows[0],...change}]))).toThrow();
    expect(() => parseVerses(csv([rows[0],rows[0]]))).toThrow('Duplicate');
  });
  it('skips exact duplicates but rejects conflicting text and keeps translations separate', () => {
    const input = parseVerses(csv(rows));
    expect(planVerseImport(input,rows)).toMatchObject({versesToCreate:0,skipped:1});
    expect(() => planVerseImport(input,[{...rows[0],text:'Different text'}])).toThrow('different text');
    expect(verseKey({...rows[0],translation:'OTHER'})).not.toBe(verseKey(rows[0]));
  });
  it('previews without writing, commits once, links the book, and exposes saved counts and verses', async () => {
    const service = new ScriptureVersesService();
    expect(await service.import(csv(rows),true)).toMatchObject({versesToCreate:1,skipped:0});
    expect((await service.list()).total).toBe(0);
    expect(await service.import(csv(rows),false)).toEqual({versesCreated:1,skipped:0});
    expect(await service.import(csv(rows),false)).toEqual({versesCreated:0,skipped:1});
    expect((await db.orm.public.ScriptureBook.all()).filter(b => b.name === 'Genesis')).toHaveLength(1);
    expect(await service.list('Genesis')).toMatchObject({ total:1,rows });
  });
  it('rejects the whole conflicting file without saving its other rows', async () => {
    const service = new ScriptureVersesService();
    await expect(service.import(csv([{...rows[0],verse:2},{...rows[0],text:'Conflicting'}]),false)).rejects.toThrow('different text');
    expect((await service.list()).total).toBe(1);
  });
  it('requires a scoped, signed verse upload ticket', async () => {
    process.env.JWT_SECRET = 'test-only-scripture-import-secret';
    const input = {kind:'verses',stage:'preview',size:30,sha256:'a'.repeat(64)};
    const pipe = new ValidationPipe({transform:true,whitelist:true,forbidNonWhitelisted:true});
    await expect(pipe.transform(input,{type:'body',metatype:ImportTicketDto})).resolves.toMatchObject(input);
    const {ticket} = issueImportTicket(input as ImportTicketDto,{sub:1,sessionId:2});
    expect(verifyImportTicket(ticket)).toMatchObject(input);
    expect(() => verifyImportTicket(ticket+'x')).toThrow();
  });
});
