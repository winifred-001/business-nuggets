import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { CreateSitePageDto, UpdateLegalPageDto } from './legal-pages.dto';
import { LegalPagesService } from './legal-pages.service';

jest.mock('../prisma/db', () => {
  const stored = new Map<string, { slug: string; content: string; updatedAt: string }>();
  const updatedAt = '2026-11-23T12:00:00.000Z';
  const query = jest.fn(async (statement: { sql: string; values: string[] }) => {
    if (statement.sql.includes('INSERT INTO "LegalPage"')) {
      const [slug, content] = statement.values;
      if (stored.has(slug)) return [];
      stored.set(slug, { slug, content, updatedAt });
      return [{ slug }];
    }
    if (statement.sql.includes('SELECT "slug"')) return [...stored.values()];
    if (statement.sql.includes('SELECT "content"')) {
      const record = stored.get(statement.values[0]);
      return record ? [{ content: record.content, updatedAt: record.updatedAt }] : [];
    }
    return [];
  });
  const execute = jest.fn(async (statement: { sql: string; values: string[] }) => {
    if (statement.sql.includes('DELETE FROM "LegalPage"')) stored.delete(statement.values[0]);
    if (statement.sql.includes('INSERT INTO "LegalPage"')) {
      const [slug, content] = statement.values;
      stored.set(slug, { slug, content, updatedAt });
    }
    return 1;
  });
  return { db: {
    runtime: () => ({ query, execute }),
    raw: { sql: (strings: TemplateStringsArray, ...values: string[]) => {
      const statement = { sql: strings.join('?'), values };
      const builder = { affectedCount: () => builder, returnsRow: () => builder, build: () => statement };
      return builder;
    } },
  } };
});

const input = (slug = 'test-page'): CreateSitePageDto => ({
  slug, title: 'Custom landing page', introduction: 'Short description', notice: '',
  published: false, showInNavigation: true, navLabel: 'Read more',
  metaDescription: 'SEO description',
  sections: [
    { id: 'hero', title: 'Hero', body: 'Welcome', kind: 'text', width: 'full' },
    { id: 'cta', title: 'Explore', body: 'Discover more', kind: 'button',
      buttonText: 'Explore Library', buttonHref: '/library' },
  ],
});
const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });

describe('Admin page builder', () => {
  it('creates private drafts and publishes custom pages without changing built-in URLs', async () => {
    const service = new LegalPagesService();
    const draft = await service.createPage(input('new-program'));
    expect(draft.slug).toBe('new-program');
    expect(draft.sections.map(section => section.id)).toEqual(['hero', 'cta']);
    await expect(service.getPage('new-program')).rejects.toThrow('Site page not found');
    expect((await service.listCustomPages()).find(page => page.slug === 'new-program')?.published).toBe(false);
    expect(await service.listCustomPages(true)).toEqual([]);
    await service.updatePage('new-program', { ...input('new-program'), published: true,
      sections: [input().sections[1], input().sections[0]] });
    expect((await service.getPage('new-program'))?.sections.map(section => section.id)).toEqual(['cta', 'hero']);
    expect((await service.listCustomPages(true))[0]?.href).toBe('/pages/new-program');
    await service.deleteCustomPage('new-program');
    await expect(service.getPage('new-program')).rejects.toThrow('Site page not found');
    await expect(service.deleteCustomPage('about')).rejects.toThrow('cannot be deleted');
  });

  it('rejects duplicate slugs and protects core pages', async () => {
    const service = new LegalPagesService();
    await expect(service.createPage(input('about'))).rejects.toThrow('already exists');
    await service.createPage(input('created-page'));
    await expect(service.createPage(input('created-page'))).rejects.toThrow('already in use');
  });

  it('validates media, action links, block kinds, metadata and unknown nested properties', async () => {
    const validate = (value: unknown) => pipe.transform(value, { type: 'body', metatype: CreateSitePageDto });
    await expect(validate(input('valid-page'))).resolves.toHaveProperty('slug', 'valid-page');
    await expect(validate({ ...input(), sections: [
      { ...input().sections[0], imageUrl: 'javascript:alert(1)' },
    ] })).rejects.toThrow();
    await expect(validate({ ...input(), sections: [
      { ...input().sections[0], kind: 'script' },
    ] })).rejects.toThrow();
    await expect(validate({ ...input(), sections: [
      { ...input().sections[0], html: '<script>alert(1)</script>' },
    ] })).rejects.toThrow();
    await expect(validate({ ...input(), published: 'true' })).rejects.toThrow();
    await expect(validate({ ...input(), slug: '../admin' })).rejects.toThrow();
  });

  it('retains legacy page update compatibility', async () => {
    const valid: UpdateLegalPageDto = {
      title: 'About Business Nuggets', introduction: 'Introduction', notice: '',
      sections: [{ id: 'mission', title: 'Our mission', body: 'Helpful content' }],
    };
    const service = new LegalPagesService();
    expect((await service.updatePage('about', valid))?.title).toBe(valid.title);
    expect((await service.getPage('about'))?.sections[0].body).toBe('Helpful content');
  });
});
