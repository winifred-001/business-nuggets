import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { SaveCollectionDto } from './collections.dto';
import { db } from '../prisma/db';

jest.mock('../prisma/db', () => {
  const records = new Map<string, { id: string; slug: string; content: string; updatedAt: string }>();
  let version = 0;
  const nuggets = [{ id: 'free', slug: 'free-slug', status: 'published', keyPrinciple: 'private teaching' }, { id: 'gold', slug: 'gold-slug', status: 'published', isGold: true, audioUrl: 'private-audio' }, { id: 'draft', slug: 'draft-slug', status: 'draft' }];
  const query = jest.fn(async (plan: { sql: string; values: string[] }) => {
    const values = plan.values;
    if (plan.sql.includes('SELECT "id", "slug"')) return [...records.values()];
    if (plan.sql.includes('INSERT INTO')) {
      if ([...records.values()].some(item => item.slug === values[1])) return [];
      records.set(values[0], { id: values[0], slug: values[1], content: values[2], updatedAt: String(++version) });
      return [{ id: values[0] }];
    }
    if (plan.sql.includes('UPDATE')) {
      const item = records.get(values[2]);
      if (!item || item.updatedAt !== values[3]) return [];
      records.set(item.id, { ...item, slug: values[0], content: values[1], updatedAt: String(++version) });
      return [{ id: item.id }];
    }
    if (plan.sql.includes('DELETE')) { const exists = records.delete(values[0]); return exists ? [{ id: values[0] }] : []; }
    throw new Error('Unexpected query');
  });
  return { db: {
    raw: { sql: (strings: TemplateStringsArray, ...values: string[]) => {
      const plan = { sql: strings.join('?'), values };
      return { affectedCount: () => ({ build: () => plan }), returnsRow: () => ({ build: () => plan }) };
    } },
    runtime: () => ({ execute: async () => 0, query }),
    orm: { public: { Nugget: { all: async () => nuggets, where: () => ({ all: async () => nuggets.filter(item => item.status === 'published') }) } } },
  } };
});
const input = (slug: string): SaveCollectionDto => ({ title: 'Reading series', slug, description: 'A course', image: '', visible: true, nuggetIds: ['gold', 'draft', 'free'] });
describe('Admin and public collections', () => {
  const service = new CollectionsService();
  it('validates writes and rejects malformed or duplicate membership', async () => {
    const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
    await expect(pipe.transform({ ...input('valid'), nuggetIds: ['free', 'free'] }, {type:'body',metatype:SaveCollectionDto})).rejects.toThrow();
    await expect(pipe.transform({ ...input('valid'), slug: '../invalid' }, {type:'body',metatype:SaveCollectionDto})).rejects.toThrow();
    await expect(service.save({ ...input('missing'), nuggetIds: ['missing'] })).rejects.toThrow('no longer exists');
  });
  it('preserves selected reading order and exposes only published IDs/slugs, never Gold teaching or audio', async () => {
    const saved = await service.save(input('reading-series'));
    expect(saved.nuggetIds).toEqual(['gold','draft','free']);
    const publicItem = (await service.publicList()).find(item => item.id === saved.id)!;
    expect(publicItem.nuggetSlugs).toEqual(['gold-slug','free-slug']);
    expect(JSON.stringify(publicItem)).not.toContain('private');
    expect(JSON.stringify(publicItem)).not.toContain('draft-slug');
  });
  it('updates order and visibility, rejects stale edits and duplicate slugs, and deletes only the collection', async () => {
    const saved = await service.save(input('editable'));
    await expect(service.save(input('editable'))).rejects.toThrow('already uses');
    const updated = await service.save({ ...saved, nuggetIds: ['free','gold'], visible: false }, saved.id);
    expect(updated.nuggetIds).toEqual(['free','gold']);
    expect((await service.publicList()).some(item => item.id === saved.id)).toBe(false);
    await expect(service.save(saved, saved.id)).rejects.toThrow('changed');
    await service.remove(saved.id);
    expect((await service.list()).some(item => item.id === saved.id)).toBe(false);
    expect((await db.orm.public.Nugget.all()).length).toBe(3);
  });
});
