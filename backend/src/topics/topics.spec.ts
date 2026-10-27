import { createHash } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import { ImportUploadController } from '../imports/import-upload.controller';
import {
  ImportTicketGuard,
  issueImportTicket,
  verifyImportTicket,
} from '../imports/import-ticket';
import { SessionsService } from '../auth/sessions.service';
import { AdminRequestValidationInterceptor } from '../admin/admin-request-validation.interceptor';
import { bulkContent } from '../admin/bulk-content';
import { importHierarchy } from '../imports/hierarchy-import';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Workbook } from 'exceljs';
import { readImportFile } from '../imports/import-file';
import { importNuggets } from '../imports/hierarchy-import';
import { parseNuggets } from '../imports/nugget-import';
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
        if (key === 'Category') {
          const allowed = [
            'id',
            'name',
            'slug',
            'description',
            'visible',
            'displayOrder',
          ];
          for (const field of Object.keys(data))
            if (!allowed.includes(field))
              throw new Error(`Unknown column "${field}" in table "Category"`);
        }
        if (key === 'Nugget' && failOnTopic === data.title)
          throw new Error('Write failed');
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
    expect(() => parseTaxonomyCsv('x'.repeat(5 * 1024 * 1024 + 1))).toThrow(
      '5 MB',
    );
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
  const previousSecret = process.env.JWT_SECRET;
  let revoked = false;
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-import-signing-key';
    const params: unknown[] = Reflect.getMetadata(
      'design:paramtypes',
      AdminController,
    );
    const module = await Test.createTestingModule({
      controllers: [AdminController, ImportUploadController],
      providers: [
        ...params.map((token) => ({
          provide: token as never,
          useValue: token === TopicsService ? service() : {},
        })),
        ImportTicketGuard,
        {
          provide: SessionsService,
          useValue: {
            validateSession: async () => {
              if (revoked) throw new UnauthorizedException('Session revoked');
            },
            getAuthenticatedUser: async () => ({
              id: 1,
              role: 'owner',
              email: 'owner@example.com',
            }),
          },
        },
      ],
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
          Object.assign(context.switchToHttp().getRequest(), {
            user: { sub: 1, sessionId: 1 },
          });
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
    app.useGlobalInterceptors(new AdminRequestValidationInterceptor());
    await app.init();
  });
  afterAll(async () => {
    await app.close();
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
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
  it.each(['json', 'xlsx'])(
    'imports category summaries from %s through multipart routes',
    async (format) => {
      let buffer: Buffer;
      if (format === 'json')
        buffer = Buffer.from(
          JSON.stringify([
            {
              Category: 'Planning',
              'Brief Description': 'Plan carefully',
              'Number of Nuggets': 12,
            },
          ]),
        );
      else {
        const workbook = new Workbook();
        workbook.addWorksheet('Categories').addRows([
          ['Category', 'Brief Description', 'Number of Nuggets'],
          ['Planning', 'Plan carefully', 12],
        ]);
        buffer = Buffer.from(await workbook.xlsx.writeBuffer());
      }
      const response = await request(app.getHttpServer())
        .post('/admin/topics/import')
        .set('Authorization', 'Bearer allowed')
        .set('x-test-permission', 'manageNuggets')
        .attach('file', buffer, `summary.${format}`)
        .expect(201);
      expect(response.body.categoriesCreated).toBe(1);
      expect(state.Category[0]).toMatchObject({
        name: 'Planning',
        description: 'Plan carefully',
      });
    },
  );
  it('previews and imports Nuggets from the new authenticated endpoints', async () => {
    const buffer = Buffer.from(
      JSON.stringify([
        {
          number: 1001,
          title: 'Integrity',
          topic: 'Leadership',
          songUrl: 'https://example.com/song.mp3',
          nuggetUrl: 'https://example.com/nugget.mp3',
          practicalActionPlan: ['Act'],
          status: 'published',
        },
      ]),
    );
    await request(app.getHttpServer())
      .post('/admin/nuggets/import')
      .attach('file', buffer, 'nuggets.json')
      .expect(401);
    await request(app.getHttpServer())
      .post('/admin/nuggets/import')
      .set('Authorization', 'Bearer allowed')
      .attach('file', buffer, 'nuggets.json')
      .expect(403);
    const preview = await request(app.getHttpServer())
      .post('/admin/nuggets/import/preview')
      .set('Authorization', 'Bearer allowed')
      .set('x-test-permission', 'manageNuggets')
      .attach('file', buffer, 'nuggets.json')
      .expect(201);
    expect(preview.body.nuggetsToCreate).toBe(1);
    expect(state.Nugget).toEqual([]);
    const saved = await request(app.getHttpServer())
      .post('/admin/nuggets/import')
      .set('Authorization', 'Bearer allowed')
      .set('x-test-permission', 'manageNuggets')
      .attach('file', buffer, 'nuggets.json')
      .expect(201);
    expect(saved.body.nuggetsCreated).toBe(1);
    expect(state.Nugget[0]).toMatchObject({
      status: 'draft',
      publishedAt: null,
      audioUrl: 'https://example.com/song.mp3',
      nuggetAudioUrl: 'https://example.com/nugget.mp3',
      practicalActionPlan: ['Act'],
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
      .attach('file', Buffer.alloc(5 * 1024 * 1024 + 1), 'large.csv')
      .expect(413);
    expect(state.Topic).toEqual([]);
  });
  it('issues scoped upload authorization and accepts a full 5 MB file directly', async () => {
    const source = JSON.stringify([
      {
        number: 900,
        title: 'Five MB upload',
        topic: 'New Topic',
        category: 'New Category',
      },
    ]);
    const file = Buffer.from(
      source + ' '.repeat(5 * 1024 * 1024 - Buffer.byteLength(source)),
    );
    const sha256 = createHash('sha256').update(file).digest('hex');
    const ticket = await request(app.getHttpServer())
      .post('/admin/imports/ticket')
      .set('Authorization', 'Bearer allowed')
      .set('x-test-permission', 'manageNuggets')
      .send({ kind: 'nuggets', stage: 'preview', size: file.length, sha256 })
      .expect(201);
    const response = await request(app.getHttpServer())
      .post('/admin-imports/nuggets/preview')
      .set('Authorization', `Bearer ${ticket.body.ticket}`)
      .set('x-test-permission', 'manageNuggets')
      .attach('file', file, 'five.json')
      .expect(201);
    expect(response.body).toMatchObject({
      nuggetsToCreate: 1,
      topicsToCreate: 1,
      categoriesToCreate: 1,
    });
    expect(state.Nugget).toEqual([]);
    await request(app.getHttpServer())
      .post('/admin-imports/nuggets/commit')
      .set('Authorization', `Bearer ${ticket.body.ticket}`)
      .set('x-test-permission', 'manageNuggets')
      .attach('file', file, 'five.json')
      .expect(401);
    await request(app.getHttpServer())
      .post('/admin-imports/nuggets/preview')
      .set('Authorization', `Bearer ${ticket.body.ticket}`)
      .set('x-test-permission', 'manageNuggets')
      .attach('file', Buffer.from('changed'), 'five.json')
      .expect(400);
    revoked = true;
    await request(app.getHttpServer())
      .post('/admin-imports/nuggets/preview')
      .set('Authorization', `Bearer ${ticket.body.ticket}`)
      .set('x-test-permission', 'manageNuggets')
      .attach('file', file, 'five.json')
      .expect(401);
    revoked = false;
    await request(app.getHttpServer())
      .post('/admin-imports/nuggets/preview')
      .set('Authorization', `Bearer ${ticket.body.ticket}`)
      .set('x-test-permission', 'manageNuggets')
      .attach('file', Buffer.alloc(5 * 1024 * 1024 + 1), 'large.json')
      .expect(413);
  });
  it('protects direct uploads, rejects unauthorized tickets and validates bulk requests', async () => {
    await request(app.getHttpServer())
      .post('/admin-imports/topics/preview')
      .attach('file', Buffer.from(csv), 'items.csv')
      .expect(401);
    await request(app.getHttpServer())
      .post('/admin/imports/ticket')
      .set('Authorization', 'Bearer allowed')
      .send({
        kind: 'topics',
        stage: 'preview',
        size: 10,
        sha256: 'a'.repeat(64),
      })
      .expect(403);
    await request(app.getHttpServer())
      .post('/admin/imports/ticket')
      .set('Authorization', 'Bearer allowed')
      .set('x-test-permission', 'manageNuggets')
      .send({
        kind: 'nuggets',
        stage: 'preview',
        size: 5 * 1024 * 1024 + 1,
        sha256: 'a'.repeat(64),
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/admin/categories/bulk')
      .set('Authorization', 'Bearer allowed')
      .set('x-test-permission', 'manageNuggets')
      .send({ ids: ['1', '1'], action: 'delete' })
      .expect(400);
    state.Category.push(category());
    await request(app.getHttpServer())
      .post('/admin/categories/bulk')
      .set('Authorization', 'Bearer allowed')
      .set('x-test-permission', 'manageNuggets')
      .send({ ids: ['1'], action: 'delete' })
      .expect(201);
    expect(state.Category).toEqual([]);
    await request(app.getHttpServer())
      .post('/admin/topics')
      .set('Authorization', 'Bearer allowed')
      .set('x-test-permission', 'manageNuggets')
      .send({ name: 'Assigned', categoryId: null })
      .expect(201);
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

describe('versatile imports and regression coverage', () => {
  const uploaded = () =>
    readFileSync(
      join(__dirname, '../../test/fixtures/category-summary.csv'),
      'utf8',
    );
  it('imports all 60 uploaded categories without writing row/type/count metadata', async () => {
    const preview = await service().previewImport(uploaded());
    expect(preview.categoriesToCreate).toBe(60);
    expect(state.Category).toEqual([]);
    const result = await service().importCsv(uploaded());
    expect(result).toMatchObject({ categoriesCreated: 60, topicsCreated: 0 });
    expect(state.Category).toHaveLength(60);
    expect(state.Category[0].description).toContain('Explores work');
    expect(Object.keys(state.Category[0])).not.toContain('row');
    expect(await service().importCsv(uploaded())).toMatchObject({
      categoriesCreated: 0,
      skipped: 60,
    });
  });
  it('rejects malformed JSON, corrupt XLSX, multiple populated sheets and formulas as 400 errors', async () => {
    for (const [name, value] of [
      ['broken.json', '{'],
      ['broken.xlsx', 'not a workbook'],
      ['object.json', '{}'],
    ]) {
      await expect(
        readImportFile({
          originalname: name,
          buffer: Buffer.from(value),
        } as Express.Multer.File),
      ).rejects.toMatchObject({ status: 400 });
    }
    const workbook = new Workbook();
    workbook.addWorksheet('One').addRows([
      ['type', 'name'],
      ['category', 'One'],
    ]);
    workbook.addWorksheet('Two').addRow(['name']);
    await expect(
      readImportFile({
        originalname: 'two.xlsx',
        buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
      } as Express.Multer.File),
    ).rejects.toThrow('one populated');
    workbook.removeWorksheet('Two');
    workbook.worksheets[0].getCell('B2').value = { formula: '1+1', result: 2 };
    await expect(
      readImportFile({
        originalname: 'formula.xlsx',
        buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
      } as Express.Multer.File),
    ).rejects.toThrow('plain values');
  });
  it('parses Nugget lists, normalizes field labels and always saves drafts', async () => {
    const csv =
      'Number,Title,Topic,Song URL,Nugget URL,Practical Action Plan,Challenges,isGold,status\n7,Wise Work,Work,https://example.com/song.mp3,https://example.com/talk.mp3,One|Two,Money|Work,yes,published';
    expect(parseNuggets(csv)[0].data).toMatchObject({
      number: 7,
      practicalActionPlan: ['One', 'Two'],
      challenges: ['Money', 'Work'],
      isGold: true,
      status: 'draft',
    });
    expect(await importNuggets(csv, true)).toMatchObject({
      nuggetsToCreate: 1,
    });
    expect(state.Nugget).toEqual([]);
    expect(await importNuggets(csv, false)).toMatchObject({
      nuggetsCreated: 1,
    });
    expect(await importNuggets(csv, false)).toMatchObject({
      nuggetsCreated: 0,
      skipped: 1,
    });
  });
  it.each([
    'number,title,topic\n0,Title,Work',
    'number,title,topic\n1,,Work',
    'number,title,topic\n1,Title,Work\n1,Other,Work',
    'number,title,topic,songUrl\n1,Title,Work,javascript:alert(1)',
    'number,title,topic,isGold\n1,Title,Work,maybe',
    'number,title,topic,unknown\n1,Title,Work,value',
    'number,title,topic,practicalActionPlan\n1,Title,Work,[1]',
  ])('rejects invalid Nuggets before writing: %s', async (csv) => {
    await expect(importNuggets(csv, false)).rejects.toMatchObject({
      status: 400,
    });
    expect(state.Nugget).toEqual([]);
  });
  it('rolls back all imported Nuggets if a later write fails', async () => {
    failOnTopic = 'Fail';
    await expect(
      importNuggets('number,title,topic\n1,First,Work\n2,Fail,Work', false),
    ).rejects.toThrow('Write failed');
    expect(state.Nugget).toEqual([]);
  });
});

describe('linked hierarchy imports', () => {
  const hierarchy = async () =>
    readImportFile({
      originalname: 'hierarchy.json',
      buffer: Buffer.from(
        JSON.stringify([
          {
            type: 'category',
            name: 'Stewardship',
            description: 'Use resources wisely',
          },
          {
            type: 'topic',
            name: 'Budgeting',
            category: 'Stewardship',
            description: 'Plan spending',
          },
          {
            type: 'nugget',
            number: 701,
            title: 'Plan carefully',
            topic: 'Budgeting',
            category: 'Stewardship',
            songUrl: 'https://example.com/song.mp3',
            nuggetUrl: 'https://example.com/talk.mp3',
          },
        ]),
      ),
    } as Express.Multer.File);
  it('previews then atomically imports all three levels', async () => {
    const csv = await hierarchy();
    const preview = await importHierarchy(csv, true, 'topics');
    expect(preview).toMatchObject({
      categoriesToCreate: 1,
      topicsToCreate: 1,
      nuggetsToCreate: 1,
    });
    expect(state.Category).toEqual([]);
    expect(state.Topic).toEqual([]);
    expect(state.Nugget).toEqual([]);
    const result = await importHierarchy(csv, false, 'topics');
    expect(result).toMatchObject({
      categoriesCreated: 1,
      topicsCreated: 1,
      nuggetsCreated: 1,
    });
    expect(state.Topic[0]).toMatchObject({
      name: 'Budgeting',
      categoryId: state.Category[0].id,
    });
    expect(state.Nugget[0]).toMatchObject({
      topic: 'Budgeting',
      status: 'draft',
      audioUrl: 'https://example.com/song.mp3',
      nuggetAudioUrl: 'https://example.com/talk.mp3',
    });
    expect(await importHierarchy(csv, false, 'topics')).toMatchObject({
      categoriesCreated: 0,
      topicsCreated: 0,
      nuggetsCreated: 0,
    });
  });
  it('creates missing categories/topics directly from a Nugget import', async () => {
    await importNuggets(
      'number,title,topic,category\n1,Wise Work,Integrity,Leadership',
      false,
    );
    expect(state.Category[0].name).toBe('Leadership');
    expect(state.Topic[0]).toMatchObject({
      name: 'Integrity',
      categoryId: state.Category[0].id,
    });
    expect(state.Nugget[0].topic).toBe('Integrity');
  });
  it('reuses canonical topic spelling and previews its existing category', async () => {
    state.Category.push(category());
    state.Topic.push(topic(1, 'Integrity', 1));
    const preview = await importNuggets(
      'number,title,topic\n1,Wise Work,integrity',
      true,
    );
    expect(
      'rows' in preview && preview.rows.find((row) => row.type === 'nugget'),
    ).toMatchObject({ topic: 'Integrity', category: 'Leadership' });
    await importNuggets('number,title,topic\n1,Wise Work,integrity', false);
    expect(state.Nugget[0].topic).toBe('Integrity');
    expect(state.Topic).toHaveLength(1);
  });
  it('links an uncategorized existing topic without overwriting its description or visibility', async () => {
    state.Topic.push({ ...topic(), description: 'Keep this', visible: false });
    const csv = 'number,title,topic,category\n1,Wise Work,Integrity,Leadership';
    expect(await importNuggets(csv, true)).toMatchObject({
      topicsToAssign: 1,
      categoriesToCreate: 1,
    });
    expect(state.Topic[0].categoryId).toBeNull();
    await importNuggets(csv, false);
    expect(state.Topic[0]).toMatchObject({
      categoryId: state.Category[0].id,
      description: 'Keep this',
      visible: false,
    });
  });
  it('rejects category conflicts and rolls back every write', async () => {
    state.Category.push(category());
    state.Topic.push(topic(1, 'Integrity', 1));
    await expect(
      importNuggets(
        'number,title,topic,category\n1,Wise Work,Integrity,Other',
        false,
      ),
    ).rejects.toThrow('already belongs');
    expect(state.Category).toHaveLength(1);
    expect(state.Nugget).toEqual([]);
    state.Category = [];
    state.Topic = [];
    failOnTopic = 'Plan carefully';
    await expect(
      importHierarchy(await hierarchy(), false, 'topics'),
    ).rejects.toThrow('Write failed');
    expect(state.Category).toEqual([]);
    expect(state.Topic).toEqual([]);
    expect(state.Nugget).toEqual([]);
  });
  it('does not create orphan taxonomy for skipped Nuggets', async () => {
    state.Nugget.push({
      id: 'nugget-1',
      number: 1,
      slug: 'old',
      topic: 'Existing',
    });
    await importNuggets(
      'number,title,topic,category\n1,Existing,New Topic,New Category',
      false,
    );
    expect(state.Topic).toEqual([]);
    expect(state.Category).toEqual([]);
  });
  it('supports hierarchy templates with Nugget columns even when only taxonomy rows remain', async () => {
    await importHierarchy(
      'type,name,category,number,title,topic\ncategory,Leadership,,,,\ntopic,Integrity,Leadership,,,',
      false,
      'topics',
    );
    expect(state.Category).toHaveLength(1);
    expect(state.Topic).toHaveLength(1);
    expect(state.Nugget).toEqual([]);
  });
});

describe('bulk content actions', () => {
  it('deletes only the selected empty categories, keeping unrelated data', async () => {
    state.Category.push(category(), {
      ...category(),
      id: 2,
      name: 'Keep',
      slug: 'keep',
    });
    state.Topic.push(topic());
    expect(
      await bulkContent('categories', { ids: ['1'], action: 'delete' }),
    ).toMatchObject({ affected: 1 });
    expect(state.Category.map((row) => row.name)).toEqual(['Keep']);
    expect(state.Topic).toHaveLength(1);
  });
  it('blocks a whole batch containing an in-use category or topic', async () => {
    state.Category.push(category(), {
      ...category(),
      id: 2,
      name: 'Empty',
      slug: 'empty',
    });
    state.Topic.push(topic(1, 'Integrity', 1));
    await expect(
      bulkContent('categories', { ids: ['2', '1'], action: 'delete' }),
    ).rejects.toThrow('Nothing was deleted');
    expect(state.Category).toHaveLength(2);
    state.Topic.push(topic(2, 'Empty'));
    state.Nugget.push({ id: 'nugget-1', topic: 'integrity', status: 'draft' });
    await expect(
      bulkContent('topics', { ids: ['2', '1'], action: 'delete' }),
    ).rejects.toThrow('Reassign');
    expect(state.Topic).toHaveLength(2);
  });
  it('deletes unused topics and their follows, and changes visibility in batches', async () => {
    state.Topic.push(topic(1, 'Integrity'), topic(2, 'Planning'));
    state.FollowedTopic.push({ id: 1, userId: 1, topic: 'INTEGRITY' });
    await bulkContent('topics', { ids: ['1', '2'], action: 'hide' });
    expect(state.Topic.every((row) => row.visible === false)).toBe(true);
    await bulkContent('topics', { ids: ['1', '2'], action: 'show' });
    expect(state.Topic.every((row) => row.visible === true)).toBe(true);
    await bulkContent('topics', { ids: ['1'], action: 'delete' });
    expect(state.Topic.map((row) => row.id)).toEqual([2]);
    expect(state.FollowedTopic).toEqual([]);
  });
  it('rolls back missing IDs and rejects duplicates, bad types and unsupported actions', async () => {
    state.Category.push(category());
    await expect(
      bulkContent('categories', { ids: ['1', '99'], action: 'delete' }),
    ).rejects.toThrow('no longer exists');
    expect(state.Category).toHaveLength(1);
    await expect(
      bulkContent('categories', { ids: ['1', '1'], action: 'delete' }),
    ).rejects.toThrow('distinct');
    await expect(
      bulkContent('categories', { ids: ['bad'], action: 'delete' }),
    ).rejects.toThrow('Invalid');
    await expect(
      bulkContent('topics', { ids: ['1'], action: 'publish' }),
    ).rejects.toThrow('not supported');
  });
  it('bulk publishes, features and drafts selected Nuggets and enforces the free limit', async () => {
    state.Nugget.push(
      { id: 'a', status: 'draft', isGold: false, publishedAt: null },
      { id: 'b', status: 'published', isGold: true, publishedAt: '2026-01-01' },
    );
    await bulkContent('nuggets', { ids: ['a'], action: 'publish' });
    expect(state.Nugget[0]).toMatchObject({ status: 'published' });
    await bulkContent('nuggets', { ids: ['a', 'b'], action: 'feature' });
    expect(state.Nugget.every((row) => row.featured === true)).toBe(true);
    await bulkContent('nuggets', { ids: ['a'], action: 'draft' });
    expect(state.Nugget[0]).toMatchObject({
      status: 'draft',
      publishedAt: null,
    });
    state.Nugget = Array.from({ length: 11 }, (_, i) => ({
      id: `n-${i}`,
      status: 'draft',
      isGold: false,
    }));
    await expect(
      bulkContent('nuggets', {
        ids: state.Nugget.map((row) => String(row.id)),
        action: 'publish',
      }),
    ).rejects.toThrow('Only 10');
    expect(state.Nugget.every((row) => row.status === 'draft')).toBe(true);
    await bulkContent('nuggets', { ids: ['n-1', 'n-2'], action: 'delete' });
    expect(state.Nugget).toHaveLength(9);
  });
});

describe('import upload token security', () => {
  it('rejects tampering, expiry and ordinary JWT authentication', async () => {
    const previous = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test-ticket-key';
    try {
      const token = issueImportTicket(
        { kind: 'nuggets', stage: 'preview', size: 12, sha256: 'a'.repeat(64) },
        { sub: 1, sessionId: 1 },
      ).ticket;
      expect(verifyImportTicket(token)).toMatchObject({
        sub: 1,
        sessionId: 1,
        kind: 'nuggets',
        stage: 'preview',
      });
      expect(() =>
        verifyImportTicket(
          token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a'),
        ),
      ).toThrow('invalid');
      await expect(
        new JwtService().verifyAsync(token, { secret: process.env.JWT_SECRET }),
      ).rejects.toThrow();
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now + 6 * 60 * 1000);
      expect(() => verifyImportTicket(token)).toThrow('expired');
      jest.restoreAllMocks();
    } finally {
      if (previous === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = previous;
    }
  });
});
