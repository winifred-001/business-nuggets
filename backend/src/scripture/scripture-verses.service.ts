import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { db } from '../prisma/db';
import { BIBLE_CHAPTERS, canonicalBook } from './bible-books';
import { parseVerses, planVerseImport, type ScriptureVerse } from './verse-import';

const rowShape = { book: 'pg/text@1', chapter: 'pg/int4@1', verse: 'pg/int4@1', translation: 'pg/text@1', text: 'pg/text@1' } as const;
@Injectable()
export class ScriptureVersesService {
  private tableReady?: Promise<void>;
  private ensureTable() {
    if (!this.tableReady) this.tableReady = db.runtime().execute(db.raw.sql`
      CREATE TABLE IF NOT EXISTS "ScriptureVerse" (
        "book" text NOT NULL, "chapter" integer NOT NULL, "verse" integer NOT NULL,
        "translation" text NOT NULL, "text" text NOT NULL,
        PRIMARY KEY ("book", "chapter", "verse", "translation")
      )
    `.affectedCount().build()).then(() => undefined).catch(error => { this.tableReady = undefined; throw error; });
    return this.tableReady;
  }
  async counts() {
    await this.ensureTable();
    return db.runtime().query(db.raw.sql`SELECT "book", count(*)::int AS "count" FROM "ScriptureVerse" GROUP BY "book"`.returnsRow({ book: 'pg/text@1', count: 'pg/int4@1' }).build());
  }
  async list(book?: string, requestedPage = '1') {
    const name = book ? canonicalBook(book) : '';
    if (book && !name) throw new BadRequestException('Unknown Bible book.');
    const page = Number(requestedPage);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000) throw new BadRequestException('Page must be a positive whole number.');
    await this.ensureTable();
    const offset = (page - 1) * 50;
    const counts = await this.counts();
    const total = counts.filter(row => !name || row.book === name).reduce((sum, row) => sum + row.count, 0);
    const rows = name
      ? await db.runtime().query(db.raw.sql`SELECT * FROM "ScriptureVerse" WHERE "book" = ${name} ORDER BY "chapter", "verse", "translation" LIMIT 50 OFFSET ${offset}`.returnsRow(rowShape).build())
      : await db.runtime().query(db.raw.sql`SELECT * FROM "ScriptureVerse" ORDER BY "book", "chapter", "verse", "translation" LIMIT 50 OFFSET ${offset}`.returnsRow(rowShape).build());
    return { rows, total, page, totalPages: Math.max(1, Math.ceil(total / 50)) };
  }
  async import(csv: string, preview: boolean) {
    const incoming = parseVerses(csv);
    await this.ensureTable();
    return db.transaction(async tx => {
      // Serialize verse imports so two concurrent files cannot bypass conflict checks.
      await tx.query(db.raw.sql`WITH locked AS (SELECT pg_advisory_xact_lock(313120)) SELECT 1::int AS "locked" FROM locked`.returnsRow({ locked: 'pg/int4@1' }).build());
      const keys = JSON.stringify(incoming);
      const existing = await tx.query(db.raw.sql`
        SELECT s.* FROM "ScriptureVerse" s JOIN jsonb_to_recordset(${keys}::jsonb)
        AS v("book" text, "chapter" integer, "verse" integer, "translation" text)
        USING ("book", "chapter", "verse", "translation")
      `.returnsRow(rowShape).build());
      const plan = planVerseImport(incoming, existing as ScriptureVerse[]);
      if (preview) return plan;
      const additions = plan.rows.filter(row => row.action === 'create');
      if (additions.length) {
        const payload = JSON.stringify(additions);
        const inserted = await tx.query(db.raw.sql`
          INSERT INTO "ScriptureVerse" ("book", "chapter", "verse", "translation", "text")
          SELECT "book", "chapter", "verse", "translation", "text"
          FROM jsonb_to_recordset(${payload}::jsonb) AS v("book" text, "chapter" integer, "verse" integer, "translation" text, "text" text)
          ON CONFLICT DO NOTHING RETURNING "book"
        `.returnsRow({ book: 'pg/text@1' }).build());
        if (inserted.length !== additions.length) throw new ConflictException('Verse records changed. Preview the file again. Nothing was imported.');
      }
      const books = await tx.orm.public.ScriptureBook.all();
      const knownBooks = new Set(books.map(book => canonicalBook(book.name) || book.name));
      let displayOrder = books.length;
      for (const book of new Set(incoming.map(row => row.book))) {
        if (!knownBooks.has(book)) await tx.orm.public.ScriptureBook.create({
          name: book, slug: book.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          chapterCount: BIBLE_CHAPTERS[book], visible: true, displayOrder: displayOrder++,
        });
      }
      return { versesCreated: additions.length, skipped: plan.skipped };
    });
  }
}
