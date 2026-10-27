import { Test } from '@nestjs/testing';
import { UnauthorizedException, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AdminController } from '../admin/admin.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AdminPermissionGuard } from '../auth/admin-permission.guard';
import { AdminIpAllowListGuard } from '../admin/admin-ip-allow-list.guard';
import { AdminAuditInterceptor } from '../audit-logs/admin-audit.interceptor';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { parseTaxonomyCsv } from './topics-csv';
import { CreateTopicDto } from './topics.dto';
type Row = Record<string, unknown>;
let state: Record<'Topic' | 'Category' | 'Nugget' | 'FollowedTopic', Row[]>;
let failOnTopic: string | null = null;
jest.mock('../prisma/db', () => {
  const table = (key: keyof typeof state) => {
    const matches = (row: Row, filter: Row) =>
      Object.entries(filter).every(([k, v]) => row[k] === v);
    const builder = (filter: Row = {}) => ({
      all: async () =>
        structuredClone(state[key].filter((row) => matches(row, filter))),
      first: async () =>
        structuredClone(state[key].find((row) => matches(row, filter)) || null),
      forUpdate: () => builder(filter),
      update: async (data: Row) => {
        const row = state[key].find((row) => matches(row, filter));
        if (row) Object.assign(row, data);
        return row ? structuredClone(row) : null;
      },
      delete: async () => {
        state[key] = state[key].filter((row) => !matches(row, filter));
        return true;
      },
    });
    return {
      ...builder(),
      where: (filter: Row) => builder(filter),
      create: async (data: Row) => {
        if (key === 'Topic' && failOnTopic === data.name)
          throw new Error('Write failed');
        const row = {
          id: Math.max(0, ...state[key].map((row) => Number(row.id))) + 1,
          ...data,
        };
        state[key].push(row);
        return structuredClone(row);
      },
    };
  };
  const orm = {
    public: {
      Topic: table('Topic'),
      Category: table('Category'),
      Nugget: table('Nugget'),
      FollowedTopic: table('FollowedTopic'),
    },
  };
  return {
    db: {
      orm,
      transaction: async (
        work: (tx: { orm: typeof orm }) => Promise<unknown>,
      ) => {
        const backup = structuredClone(state);
        try {
          return await work({ orm });
        } catch (error) {
          state = backup;
          throw error;
        }
      },
    },
  };
});
const topic = (
  id = 1,
  name = 'Integrity',
  categoryId: number | null = null,
) => ({
  id,
  name,
  slug: name.toLowerCase(),
  description: null,
  visible: true,
  displayOrder: 0,
  categoryId,
});
const category = () => ({
  id: 1,
  name: 'Leadership',
  slug: 'leadership',
  description: null,
  visible: true,
  displayOrder: 0,
});
const service = () => new TopicsService();
beforeEach(() => {
  state = { Topic: [], Category: [], Nugget: [], FollowedTopic: [] };
  failOnTopic = null;
});
describe('CSV parsing', () => {
  it('handles BOM, CRLF, quoted commas, line breaks and escaped quotes', () => {
    const rows = parseTaxonomyCsv(
      '\uFEFFtype,name,description,category,visible\r\ncategory,Leadership,"Work, wisely",,false\r\ntopic,Integrity,"Line one\nHe said ""yes""",Leadership,true',
    );
    expect(rows[0]).toMatchObject({
      description: 'Work, wisely',
      visible: false,
    });
    expect(rows[1]).toMatchObject({
      description: 'Line one\nHe said "yes"',
      category: 'Leadership',
    });
  });
  it.each([
    'type,name\ntopic,',
    'type,name\nwrong,Name',
    'name\nName',
    'type,name,visible\ntopic,Name,maybe',
    'type,name\ntopic,"unclosed',
    'type,name\ntopic,Same\ntopic,same',
    'type,name\ntopic,A,B',
    'type,name,category\ncategory,A,Parent',
  ])('rejects invalid CSV: %s', (csv) => {
    expect(() => parseTaxonomyCsv(csv)).toThrow();
  });
  it('enforces file and row limits', () => {
    expect(() => parseTaxonomyCsv('x'.repeat(1048577))).toThrow('1 MB');
    expect(() =>
      parseTaxonomyCsv(
        'type,name\n' +
          Array.from({ length: 501 }, (_, i) => `topic,Topic ${i}`).join('\n'),
      ),
    ).toThrow('500');
  });
});
describe('Topic/category management', () => {
  it('creates categories, assigns topics and returns counts', async () => {
    const cat = await service().createCategory({ name: 'Leadership' });
    await service().createTopic({ name: 'Integrity', categoryId: cat!.id });
    state.Nugget.push({ id: 'one', topic: 'Integrity' });
    expect(await service().getCategories()).toEqual([
      expect.objectContaining({ topicCount: 1 }),
    ]);
    expect(await service().getAllTopics()).toEqual([
      expect.objectContaining({ categoryName: 'Leadership', nuggetCount: 1 }),
    ]);
  });
  it('rejects duplicate names, invalid names and missing parents', async () => {
    state.Topic.push(topic());
    state.Category.push(category());
    await expect(service().createTopic({ name: 'integrity' })).rejects.toThrow(
      'already exists',
    );
    await expect(
      service().createCategory({ name: ' leadership ' }),
    ).rejects.toThrow('already exists');
    await expect(service().createTopic({ name: '---' })).rejects.toThrow(
      'letters or numbers',
    );
    await expect(
      service().createTopic({ name: 'New', categoryId: 99 }),
    ).rejects.toThrow('Category not found');
  });
  it('renames all Nuggets and merges follows atomically', async () => {
    state.Topic.push(topic());
    state.Nugget.push(
      { id: 'one', topic: 'Integrity' },
      { id: 'two', topic: 'Integrity' },
    );
    state.FollowedTopic.push(
      { id: 1, userId: 1, topic: 'Integrity' },
      { id: 2, userId: 1, topic: 'Honesty' },
      { id: 3, userId: 2, topic: 'Integrity' },
    );
    await service().updateTopic(1, { name: 'Honesty' });
    expect(state.Nugget.every((row) => row.topic === 'Honesty')).toBe(true);
    expect(state.FollowedTopic).toHaveLength(2);
    expect(state.FollowedTopic.every((row) => row.topic === 'Honesty')).toBe(
      true,
    );
  });
  it('handles capitalization-only renames without leaving stale Nuggets or follows', async () => {
    state.Topic.push(topic());
    state.Nugget.push(
      { id: 'one', topic: 'integrity' },
      { id: 'two', topic: 'Integrity' },
    );
    state.FollowedTopic.push(
      { id: 1, userId: 1, topic: 'integrity' },
      { id: 2, userId: 1, topic: 'INTEGRITY' },
    );
    await service().updateTopic(1, { name: 'INTEGRITY' });
    expect(state.Nugget.every((row) => row.topic === 'INTEGRITY')).toBe(true);
    expect(state.FollowedTopic).toEqual([
      { id: 2, userId: 1, topic: 'INTEGRITY' },
    ]);
  });
  it('protects topics used by Nuggets', async () => {
    state.Topic.push(topic());
    state.Nugget.push({ id: 'one', topic: 'Integrity' });
    await expect(service().deleteTopic(1)).rejects.toThrow('Reassign');
    expect(state.Topic).toHaveLength(1);
    expect(state.Nugget).toHaveLength(1);
  });
  it('deletes unused topics and follows, rejects missing IDs', async () => {
    state.Topic.push(topic());
    state.FollowedTopic.push({ id: 1, userId: 1, topic: 'Integrity' });
    expect(await service().deleteTopic(1)).toEqual({ deleted: true });
    expect(state.Topic).toEqual([]);
    expect(state.FollowedTopic).toEqual([]);
    await expect(service().deleteTopic(99)).rejects.toThrow('not found');
  });
  it('protects categories until their topics are moved', async () => {
    state.Category.push(category());
    state.Topic.push(topic(1, 'Integrity', 1));
    await expect(service().deleteCategory(1)).rejects.toThrow(
      'contains topics',
    );
    await service().updateTopic(1, { categoryId: null });
    await service().deleteCategory(1);
    expect(state.Category).toEqual([]);
    expect(state.Topic).toHaveLength(1);
  });
  it('rejects stale or duplicate order lists', async () => {
    state.Topic.push(topic(), topic(2, 'Planning'));
    await expect(service().reorderTopics([1, 1])).rejects.toThrow('only once');
    await expect(service().reorderTopics([2])).rejects.toThrow('Refresh');
    await service().reorderTopics([2, 1]);
    expect(state.Topic.find((row) => row.id === 2)?.displayOrder).toBe(0);
  });
});
describe('Atomic imports', () => {
  const csv =
    'type,name,description,category,visible\ncategory,Leadership,Group,,false\ntopic,Integrity,Honest work,Leadership,true\ntopic,Planning,Plan carefully,Operations,true';
  it('previews without writes then imports categories and topics', async () => {
    expect(await service().previewImport(csv)).toMatchObject({
      categoriesToCreate: 2,
      topicsToCreate: 2,
      skipped: 0,
    });
    expect(state.Category).toEqual([]);
    expect(await service().importCsv(csv)).toEqual({
      categoriesCreated: 2,
      topicsCreated: 2,
      skipped: 0,
    });
    expect(
      state.Category.find((row) => row.name === 'Leadership')?.visible,
    ).toBe(false);
    expect(state.Topic.every((row) => row.categoryId)).toBe(true);
  });
  it('skips existing records without changing data or creating unused parents', async () => {
    await service().importCsv(csv);
    expect(await service().importCsv(csv)).toEqual({
      categoriesCreated: 0,
      topicsCreated: 0,
      skipped: 3,
    });
    expect(
      await service().importCsv(
        'type,name,category\ntopic,Integrity,Unused Group',
      ),
    ).toEqual({ categoriesCreated: 0, topicsCreated: 0, skipped: 1 });
    expect(state.Category).toHaveLength(2);
  });
  it('rolls back every insert when a later insert fails', async () => {
    failOnTopic = 'Planning';
    await expect(service().importCsv(csv)).rejects.toThrow('Write failed');
    expect(state.Category).toEqual([]);
    expect(state.Topic).toEqual([]);
  });
  it('detects conflicting slugs before any write', async () => {
    state.Topic.push({
      ...topic(),
      name: 'Money & Work',
      slug: 'money-and-work',
    });
    await expect(
      service().importCsv('type,name,category\ntopic,Money and Work,New Group'),
    ).rejects.toThrow('conflicts');
    expect(state.Category).toEqual([]);
  });
});
it('validates DTO types, whitespace, length and unknown fields', async () => {
  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  for (const value of [
    { name: '   ' },
    { name: 'Good', categoryId: '1' },
    { name: 'Good', visible: 'true' },
    { name: 'Good', visible: null },
    { name: 'Good', description: null },
    { name: 'Good', categoryId: 2147483648 },
    { name: 'Good', unexpected: true },
    { name: 'Good', description: 'x'.repeat(1001) },
  ])
    await expect(
      pipe.transform(value, { type: 'body', metatype: CreateTopicDto }),
    ).rejects.toThrow();
});

describe('CSV upload HTTP routes', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const params: unknown[] = Reflect.getMetadata(
      'design:paramtypes',
      AdminController,
    );
    const module = await Test.createTestingModule({
      controllers: [AdminController],
      providers: params.map((token) => ({
        provide: token as never,
        useValue: token === TopicsService ? service() : {},
      })),
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => {
            getRequest: () => { headers: Record<string, string> };
          };
        }) => {
          if (
            context.switchToHttp().getRequest().headers.authorization !==
            'Bearer allowed'
          )
            throw new UnauthorizedException();
          return true;
        },
      })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminPermissionGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => {
            getRequest: () => { headers: Record<string, string> };
          };
        }) =>
          context.switchToHttp().getRequest().headers['x-test-permission'] ===
          'manageNuggets',
      })
      .overrideGuard(AdminIpAllowListGuard)
      .useValue({ canActivate: () => true })
      .overrideInterceptor(AdminAuditInterceptor)
      .useValue({
        intercept: (_context: unknown, next: { handle: () => unknown }) =>
          next.handle(),
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  const csv =
    'type,name,category\ncategory,Leadership,\ntopic,Integrity,Leadership';
  it('requires an authenticated permitted admin before preview/import', async () => {
    await request(app.getHttpServer())
      .post('/admin/topics/import/preview')
      .attach('file', Buffer.from(csv), 'items.csv')
      .expect(401);
    await request(app.getHttpServer())
      .post('/admin/topics/import')
      .set('Authorization', 'Bearer allowed')
      .attach('file', Buffer.from(csv), 'items.csv')
      .expect(403);
    expect(state.Topic).toEqual([]);
  });
  it('parses an uploaded CSV, previews, then saves both types', async () => {
    const preview = await request(app.getHttpServer())
      .post('/admin/topics/import/preview')
      .set('Authorization', 'Bearer allowed')
      .set('x-test-permission', 'manageNuggets')
      .attach('file', Buffer.from(csv), 'items.csv')
      .expect(201);
    expect(preview.body).toMatchObject({
      categoriesToCreate: 1,
      topicsToCreate: 1,
    });
    expect(state.Topic).toEqual([]);
    const imported = await request(app.getHttpServer())
      .post('/admin/topics/import')
      .set('Authorization', 'Bearer allowed')
      .set('x-test-permission', 'manageNuggets')
      .attach('file', Buffer.from(csv), 'items.csv')
      .expect(201);
    expect(imported.body).toMatchObject({
      categoriesCreated: 1,
      topicsCreated: 1,
    });
    const listed = await request(app.getHttpServer())
      .get('/admin/topics')
      .set('Authorization', 'Bearer allowed')
      .set('x-test-permission', 'manageNuggets')
      .expect(200);
    expect(listed.body[0]).toMatchObject({
      name: 'Integrity',
      categoryName: 'Leadership',
    });
  });
  it('rejects non-CSV, invalid UTF-8 and oversized uploads', async () => {
    for (const [name, body] of [
      ['items.txt', Buffer.from(csv)],
      ['items.csv', Buffer.from([255, 254, 255])],
    ] as const)
      await request(app.getHttpServer())
        .post('/admin/topics/import/preview')
        .set('Authorization', 'Bearer allowed')
        .set('x-test-permission', 'manageNuggets')
        .attach('file', body, name)
        .expect(400);
    await request(app.getHttpServer())
      .post('/admin/topics/import')
      .set('Authorization', 'Bearer allowed')
      .set('x-test-permission', 'manageNuggets')
      .attach('file', Buffer.alloc(1048577), 'large.csv')
      .expect(413);
    expect(state.Topic).toEqual([]);
  });
  it('validates category IDs and rejects unknown properties', async () => {
    await request(app.getHttpServer())
      .post('/admin/topics')
      .set('Authorization', 'Bearer allowed')
      .set('x-test-permission', 'manageNuggets')
      .send({ name: 'Good', categoryId: '1' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/admin/categories')
      .set('Authorization', 'Bearer allowed')
      .set('x-test-permission', 'manageNuggets')
      .send({ name: 'Good', role: 'owner' })
      .expect(400);
    await request(app.getHttpServer())
      .delete('/admin/topics/not-an-id')
      .set('Authorization', 'Bearer allowed')
      .set('x-test-permission', 'manageNuggets')
      .expect(400);
  });
});
