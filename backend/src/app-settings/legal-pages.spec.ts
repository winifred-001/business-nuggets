import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { UpdateLegalPageDto } from './legal-pages.dto';
import { LegalPagesService } from './legal-pages.service';
jest.mock('../prisma/db', () => {
  const records = new Map<string, { content: string; updatedAt: string }>();
  const runtime = {
    execute: jest.fn(async (statement: { sql: string; values: string[] }) => {
      if (statement.sql.includes('INSERT INTO')) records.set(statement.values[0], { content: statement.values[1], updatedAt: '2026-10-26T12:00:00.000Z' });
      return 1;
    }),
    query: jest.fn(async (statement: { values: string[] }) => {
      const row = records.get(statement.values[0]);
      return row ? [row] : [];
    }),
  };
  return { db: { runtime: () => runtime, raw: { sql: (strings: TemplateStringsArray, ...values: string[]) => {
    const statement = { sql: strings.join('?'), values };
    const builder = { affectedCount: () => builder, returnsRow: () => builder, build: () => statement };
    return builder;
  } } } };
});
const valid = () => ({ title: 'Privacy Policy', introduction: '', notice: '', sections: [{ id: 'information', title: 'Information', body: 'Account details.' }] });
const pipe = new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true });
const validate = (value: unknown) => pipe.transform(value, { type: 'body', metatype: UpdateLegalPageDto });
describe('Site pages', () => {
  it.each(['about', 'contact', 'faqs', 'privacy-policy', 'terms-of-use'])('saves and reloads %s through the storage adapter', async slug => {
    const service = new LegalPagesService();
    const input = { ...valid(), title: slug };
    expect(await service.updatePage(slug, input)).toEqual({ ...input, updatedAt: '2026-10-26T12:00:00.000Z' });
    expect((await service.getPage(slug)).title).toBe(slug);
  });
  it('accepts structured plain text', async () => { expect((await validate(valid())).title).toBe('Privacy Policy'); });
  it('rejects blank headings, empty sections and oversized bodies', async () => {
    await expect(validate({ ...valid(), title: '   ' })).rejects.toThrow();
    await expect(validate({ ...valid(), sections: [] })).rejects.toThrow();
    const data = valid(); data.sections[0].body = 'x'.repeat(10001);
    await expect(validate(data)).rejects.toThrow();
  });
  it('rejects unknown properties including nested content', async () => {
    await expect(validate({ ...valid(), role: 'owner' })).rejects.toThrow();
    await expect(validate({ ...valid(), sections: [{ ...valid().sections[0], html: true }] })).rejects.toThrow();
  });
  it('rejects invalid anchors and duplicate IDs before database access', async () => {
    const data = valid(); data.sections[0].id = '<invalid>';
    await expect(validate(data)).rejects.toThrow();
    const duplicate = valid(); duplicate.sections.push({ ...duplicate.sections[0] });
    await expect(new LegalPagesService().updatePage('privacy-policy', duplicate)).rejects.toThrow('unique ID');
  });
  it('rejects unsupported page slugs', async () => {
    const service = new LegalPagesService();
    await expect(service.getPage('admin')).rejects.toThrow('Site page not found');
    await expect(service.updatePage('unknown-page', valid())).rejects.toThrow('Site page not found');
  });
});
