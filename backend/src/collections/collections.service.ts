import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { db } from '../prisma/db';
import { SaveCollectionDto } from './collections.dto';

export type SavedCollection = {
  id: string; title: string; slug: string; description: string; image: string;
  visible: boolean; nuggetIds: string[]; updatedAt: string;
};

@Injectable()
export class CollectionsService {
  private tableReady?: Promise<void>;
  private ensureTable() {
    // Same durable custom-table pattern as the site's editable legal pages.
    if (!this.tableReady) this.tableReady = db.runtime().execute(db.raw.sql`
      CREATE TABLE IF NOT EXISTS "NuggetCollection" (
        "id" text PRIMARY KEY, "slug" text NOT NULL UNIQUE,
        "content" text NOT NULL, "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `.affectedCount().build()).then(() => undefined).catch(error => { this.tableReady = undefined; throw error; });
    return this.tableReady;
  }
  async list(): Promise<SavedCollection[]> {
    await this.ensureTable();
    const rows = await db.runtime().query(db.raw.sql`
      SELECT "id", "slug", "content", "updatedAt"::text AS "updatedAt"
      FROM "NuggetCollection" ORDER BY "updatedAt" DESC, "id"
    `.returnsRow({ id: 'pg/text@1', slug: 'pg/text@1', content: 'pg/text@1', updatedAt: 'pg/text@1' }).build());
    return rows.map(row => ({ ...JSON.parse(row.content), id: row.id, slug: row.slug, updatedAt: row.updatedAt }));
  }
  async publicList() {
    const [collections, nuggets] = await Promise.all([this.list(), db.orm.public.Nugget.where({ status: 'published' }).all()]);
    const byId = new Map(nuggets.map(nugget => [nugget.id, nugget.slug]));
    return collections.filter(collection => collection.visible).map(collection => ({
      id: collection.id, slug: collection.slug, title: collection.title, description: collection.description, image: collection.image,
      nuggetIds: collection.nuggetIds.filter(id => byId.has(id)),
      nuggetSlugs: collection.nuggetIds.flatMap(id => byId.has(id) ? [byId.get(id)!] : []),
    }));
  }
  async save(input: SaveCollectionDto, id?: string) {
    const title = input.title.trim();
    if (!title) throw new BadRequestException('Enter a collection title.');
    if (input.image && !/^https?:\/\//i.test(input.image) && !/^\/(?!\/)/.test(input.image)) throw new BadRequestException('Use an HTTPS image URL or a site image path.');
    const [existing, nuggets] = await Promise.all([this.list(), db.orm.public.Nugget.all()]);
    const current = id ? existing.find(item => item.id === id) : undefined;
    if (id && !current) throw new NotFoundException('Collection not found.');
    if (existing.some(item => item.slug === input.slug && item.id !== id)) throw new ConflictException('Another collection already uses this slug.');
    const knownIds = new Set(nuggets.map(nugget => nugget.id));
    if (input.nuggetIds.some(nuggetId => !knownIds.has(nuggetId))) throw new BadRequestException('A selected Nugget no longer exists. Remove it and try again.');
    if (id && (!input.updatedAt || input.updatedAt !== current!.updatedAt)) throw new ConflictException('This collection changed. Reload it before saving.');
    const content = JSON.stringify({ title, description: input.description.trim(), image: input.image.trim(), visible: input.visible, nuggetIds: input.nuggetIds });
    const collectionId = id || randomUUID();
    if (id) {
      const result = await db.runtime().query(db.raw.sql`
        UPDATE "NuggetCollection" SET "slug" = ${input.slug}, "content" = ${content}, "updatedAt" = now()
        WHERE "id" = ${id} AND "updatedAt" = ${current!.updatedAt}::timestamptz RETURNING "id"
      `.returnsRow({ id: 'pg/text@1' }).build());
      if (!result.length) throw new ConflictException('This collection changed. Reload it before saving.');
    } else {
      const inserted = await db.runtime().query(db.raw.sql`
        INSERT INTO "NuggetCollection" ("id", "slug", "content") VALUES (${collectionId}, ${input.slug}, ${content})
        ON CONFLICT ("slug") DO NOTHING RETURNING "id"
      `.returnsRow({ id: 'pg/text@1' }).build());
      if (!inserted.length) throw new ConflictException('Another collection already uses this slug.');
    }
    return (await this.list()).find(item => item.id === collectionId)!;
  }
  async remove(id: string) {
    await this.ensureTable();
    const rows = await db.runtime().query(db.raw.sql`DELETE FROM "NuggetCollection" WHERE "id" = ${id} RETURNING "id"`.returnsRow({ id: 'pg/text@1' }).build());
    if (!rows.length) throw new NotFoundException('Collection not found.');
    return { success: true };
  }
}
