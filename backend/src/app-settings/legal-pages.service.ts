import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../prisma/db';
import { CreateSitePageDto, UpdateLegalPageDto } from './legal-pages.dto';

const protectedPages = new Set(['privacy-policy', 'terms-of-use', 'about', 'contact', 'faqs', 'authors']);
const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type PageRecord = { slug: string; content: string; updatedAt: string };
type SavedPage = UpdateLegalPageDto & { isCustom?: boolean; updatedAt?: string };

/** All pages use the existing LegalPage table; no new table is created. */
@Injectable()
export class LegalPagesService {
  private tableReady?: Promise<void>;

  private ensureTable() {
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
    if (!validSlug.test(slug) || slug.length > 80) throw new NotFoundException('Site page not found');
  }

  private async getStored(slug: string): Promise<SavedPage | null> {
    await this.ensureTable();
    const rows = await db.runtime().query(db.raw.sql`
      SELECT "content", "updatedAt"::text AS "updatedAt"
      FROM "LegalPage" WHERE "slug" = ${slug}
    `.returnsRow({ content: 'pg/text@1', updatedAt: 'pg/text@1' }).build());
    if (!rows.length) return null;
    return { ...JSON.parse(rows[0].content), updatedAt: new Date(rows[0].updatedAt).toISOString() };
  }

  async getPage(slug: string) {
    this.validateSlug(slug);
    const page = await this.getStored(slug);
    // The original six routes still use their packaged defaults if unedited.
    if (protectedPages.has(slug)) return page;
    if (!page?.isCustom || page.published !== true) throw new NotFoundException('Site page not found');
    return page;
  }

  async getPageForAdmin(slug: string) {
    this.validateSlug(slug);
    const page = await this.getStored(slug);
    if (!protectedPages.has(slug) && !page?.isCustom) throw new NotFoundException('Site page not found');
    return page;
  }

  private async getAllRecords(): Promise<PageRecord[]> {
    await this.ensureTable();
    return db.runtime().query(db.raw.sql`
      SELECT "slug", "content", "updatedAt"::text AS "updatedAt"
      FROM "LegalPage" ORDER BY "slug"
    `.returnsRow({
      slug: 'pg/text@1', content: 'pg/text@1', updatedAt: 'pg/text@1',
    }).build());
  }

  async listCustomPages(publishedOnly = false) {
    const rows = await this.getAllRecords();
    return rows.flatMap(row => {
      const page = JSON.parse(row.content) as SavedPage;
      if (!page.isCustom || (publishedOnly && page.published !== true)) return [];
      return [{
        slug: row.slug, title: page.title, navLabel: page.navLabel || page.title,
        published: page.published === true, showInNavigation: page.showInNavigation === true,
        metaDescription: page.metaDescription || '', href: `/pages/${row.slug}`,
        updatedAt: row.updatedAt,
      }];
    });
  }

  private checkSections(data: UpdateLegalPageDto) {
    const ids = data.sections.map(section => section.id);
    if (new Set(ids).size !== ids.length) throw new BadRequestException('Each section must have a unique ID');
    for (const section of data.sections) {
      if (section.kind === 'divider') continue;
      if (!(section.title.trim() || section.body.trim() || section.imageUrl || section.buttonText)) {
        throw new BadRequestException('Each content block needs text, an image, or a button.');
      }
      for (const url of [section.imageUrl, section.buttonHref]) {
        if (url && !/^(?:https:\/\/[^\s]+|\/(?!\/)[^\s]*)$/.test(url)) {
          throw new BadRequestException('Only HTTPS or site-relative media and links are supported.');
        }
      }
    }
  }

  private serialize(data: UpdateLegalPageDto, previous: SavedPage | null, isCustom: boolean) {
    const sections = data.sections.map(section => ({
      id: section.id, title: section.title.trim(), body: section.body.trim(),
      ...(section.kind && { kind: section.kind }),
      ...(section.width && { width: section.width }),
      ...(section.alignment && { alignment: section.alignment }),
      ...(section.appearance && { appearance: section.appearance }),
      ...(section.imageUrl && { imageUrl: section.imageUrl.trim() }),
      ...(section.imageAlt && { imageAlt: section.imageAlt.trim() }),
      ...(section.buttonText && { buttonText: section.buttonText.trim() }),
      ...(section.buttonHref && { buttonHref: section.buttonHref.trim() }),
    }));
    return JSON.stringify({
      title: data.title.trim(), introduction: data.introduction.trim(),
      notice: data.notice.trim(), sections,
      ...(isCustom && { isCustom: true }),
      ...(data.published !== undefined || previous?.published !== undefined || isCustom
        ? { published: isCustom ? (data.published ?? previous?.published ?? false) : true } : {}),
      ...(data.showInNavigation !== undefined || previous?.showInNavigation !== undefined || isCustom
        ? { showInNavigation: data.showInNavigation ?? previous?.showInNavigation ?? false } : {}),
      ...(data.navLabel !== undefined || previous?.navLabel !== undefined || isCustom
        ? { navLabel: (data.navLabel ?? previous?.navLabel ?? '').trim() } : {}),
      ...(data.metaDescription !== undefined || previous?.metaDescription !== undefined || isCustom
        ? { metaDescription: (data.metaDescription ?? previous?.metaDescription ?? '').trim() } : {}),
    });
  }

  async createPage({ slug, ...input }: CreateSitePageDto) {
    this.validateSlug(slug);
    if (protectedPages.has(slug)) throw new ConflictException('This page already exists.');
    this.checkSections(input);
    const content = this.serialize(input, null, true);
    await this.ensureTable();
    const inserted = await db.runtime().query(db.raw.sql`
      INSERT INTO "LegalPage" ("slug", "content", "updatedAt")
      VALUES (${slug}, ${content}, now())
      ON CONFLICT ("slug") DO NOTHING RETURNING "slug"
    `.returnsRow({ slug: 'pg/text@1' }).build());
    if (!inserted.length) throw new ConflictException('This page URL is already in use.');
    return { slug, ...(await this.getPageForAdmin(slug)) };
  }

  async updatePage(slug: string, data: UpdateLegalPageDto) {
    this.validateSlug(slug);
    const previous = await this.getPageForAdmin(slug);
    const isCustom = !protectedPages.has(slug);
    this.checkSections(data);
    const content = this.serialize(data, previous, isCustom);
    await this.ensureTable();
    await db.runtime().execute(db.raw.sql`
      INSERT INTO "LegalPage" ("slug", "content", "updatedAt")
      VALUES (${slug}, ${content}, now())
      ON CONFLICT ("slug") DO UPDATE SET "content" = EXCLUDED."content", "updatedAt" = now()
    `.affectedCount().build());
    return this.getPageForAdmin(slug);
  }

  async deleteCustomPage(slug: string) {
    this.validateSlug(slug);
    if (protectedPages.has(slug)) throw new BadRequestException('Core site pages cannot be deleted.');
    await this.getPageForAdmin(slug);
    await db.runtime().execute(db.raw.sql`
      DELETE FROM "LegalPage" WHERE "slug" = ${slug}
    `.affectedCount().build());
    return { deleted: true };
  }
}
