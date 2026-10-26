import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../prisma/db';
import { UpdateLegalPageDto } from './legal-pages.dto';

@Injectable()
export class LegalPagesService {
  private tableReady?: Promise<void>;

  private ensureTable() {
    // Uses the same durable custom-table pattern as AdminRolePermission.
    // A shared promise prevents concurrent first requests from racing table setup.
    if (!this.tableReady) {
      this.tableReady = db.runtime().execute(db.raw.sql`
        CREATE TABLE IF NOT EXISTS "LegalPage" (
          "slug" text PRIMARY KEY,
          "content" text NOT NULL,
          "updatedAt" timestamptz NOT NULL DEFAULT now()
        )
      `.affectedCount().build()).then(() => undefined).catch(error => {
        this.tableReady = undefined;
        throw error;
      });
    }
    return this.tableReady;
  }

  private validateSlug(slug: string) {
    if (slug !== 'privacy-policy' && slug !== 'terms-of-use') {
      throw new NotFoundException('Legal page not found');
    }
  }

  async getPage(slug: string) {
    this.validateSlug(slug);
    await this.ensureTable();
    const rows = await db.runtime().query(db.raw.sql`
      SELECT "content", "updatedAt"::text AS "updatedAt"
      FROM "LegalPage" WHERE "slug" = ${slug}
    `.returnsRow({ content: 'pg/text@1', updatedAt: 'pg/text@1' }).build());
    if (!rows.length) return null;
    return { ...JSON.parse(rows[0].content), updatedAt: new Date(rows[0].updatedAt).toISOString() };
  }

  async updatePage(slug: string, data: UpdateLegalPageDto) {
    this.validateSlug(slug);
    const ids = data.sections.map(section => section.id);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Each section must have a unique ID');
    }
    const content = JSON.stringify({
      title: data.title.trim(), introduction: data.introduction.trim(), notice: data.notice.trim(),
      sections: data.sections.map(section => ({ id: section.id, title: section.title.trim(), body: section.body.trim() })),
    });
    await this.ensureTable();
    await db.runtime().execute(db.raw.sql`
      INSERT INTO "LegalPage" ("slug", "content", "updatedAt")
      VALUES (${slug}, ${content}, now())
      ON CONFLICT ("slug") DO UPDATE SET "content" = EXCLUDED."content", "updatedAt" = now()
    `.affectedCount().build());
    return this.getPage(slug);
  }
}
