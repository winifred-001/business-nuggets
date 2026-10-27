import { BadRequestException, ConflictException } from '@nestjs/common';
import { db } from '../prisma/db';
import { parseCsvRecords, taxonomySlug } from '../topics/topics-csv';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
const textFields = [
  'title',
  'topic',
  'tag',
  'scriptureRef',
  'scriptureText',
  'image',
  'keyPrinciple',
  'marketplaceApplication',
  'duration',
  'book',
  'bibleSection',
  'audioUrl',
  'nuggetAudioUrl',
] as const;
const listFields = ['practicalActionPlan', 'challenges'] as const;
const aliases: Record<string, string> = {
  songurl: 'audioUrl',
  nuggeturl: 'nuggetAudioUrl',
};
const key = (value: string) => value.toLowerCase().replace(/[\s_-]/g, '');
export function parseNuggets(csv: string) {
  const records = parseCsvRecords(csv);
  const fields = [
    'number',
    'slug',
    ...textFields,
    ...listFields,
    'isGold',
    'featured',
    'status',
  ];
  const byKey = new Map(fields.map((field) => [key(field), field]));
  const headers = records
    .shift()!
    .fields.map((header) => aliases[key(header)] || byKey.get(key(header)));
  if (
    headers.some((header) => !header) ||
    new Set(headers).size !== headers.length ||
    !['number', 'title', 'topic'].every((field) => headers.includes(field))
  )
    throw new BadRequestException(
      'Nuggets require number,title,topic. Download the template for supported optional fields.',
    );
  const numbers = new Set<number>(),
    slugs = new Set<string>();
  return records.map((record) => {
    const fail = (message: string): never => {
      throw new BadRequestException(`Row ${record.line}: ${message}`);
    };
    if (record.fields.length !== headers.length)
      fail('Fields do not match the header. Quote text containing commas.');
    const values = Object.fromEntries(
      headers.map((header, i) => [header!, record.fields[i]]),
    );
    const number = Number(values.number);
    if (
      !/^\d+$/.test(values.number) ||
      !Number.isSafeInteger(number) ||
      number < 1 ||
      number > 2147483647
    )
      fail('Number must be a positive whole number.');
    if (
      !values.title ||
      values.title.length > 500 ||
      !values.topic ||
      values.topic.length > 120
    )
      fail('Title (up to 500 characters) and topic (up to 120) are required.');
    const slug = values.slug || taxonomySlug(values.title);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 250)
      fail('Slug must contain lowercase letters, numbers and single hyphens.');
    if (numbers.has(number) || slugs.has(slug))
      fail('Duplicate number or slug in this file.');
    numbers.add(number);
    slugs.add(slug);
    const text = Object.fromEntries(
      textFields.map((field) => [
        field,
        values[field] || (field === 'duration' ? '00:00' : ''),
      ]),
    ) as Record<(typeof textFields)[number], string>;
    for (const [field, value] of Object.entries(text))
      if (value.length > 50000)
        fail(`${field} is too long (maximum 50,000 characters).`);
    for (const field of ['audioUrl', 'nuggetAudioUrl', 'image'] as const) {
      const value = text[field];
      if (value && !(field === 'image' && /^\/(?!\/)/.test(value))) {
        try {
          const url = new URL(value);
          if (url.protocol !== 'https:' || url.username || url.password)
            fail(`${field} must be a public HTTPS URL.`);
        } catch {
          fail(`${field} must be a public HTTPS URL.`);
        }
      }
    }
    const lists = Object.fromEntries(
      listFields.map((field) => {
        const value = values[field] || '';
        let items: unknown;
        if (value.startsWith('[')) {
          try {
            items = JSON.parse(value);
          } catch {
            fail(`${field} must be a list of text.`);
          }
        } else
          items = value
            .split(/\r?\n|\|/)
            .map((item) => item.trim())
            .filter(Boolean);
        if (
          !Array.isArray(items) ||
          items.some((item) => typeof item !== 'string') ||
          items.length > 100
        )
          fail(`${field} must contain at most 100 text items.`);
        return [field, items];
      }),
    ) as Record<(typeof listFields)[number], string[]>;
    const bool = (field: string) => {
      const value = (values[field] || 'false').toLowerCase();
      if (!['true', 'false', 'yes', 'no', '1', '0'].includes(value))
        fail(`${field} must be true or false.`);
      return ['true', 'yes', '1'].includes(value);
    };
    if (
      values.status &&
      !['draft', 'published'].includes(values.status.toLowerCase())
    )
      fail('Status must be draft or published. Imports are saved as drafts.');
    return {
      row: record.line,
      data: {
        ...text,
        ...lists,
        id: `nugget-${number}`,
        number,
        slug,
        isGold: bool('isGold'),
        featured: bool('featured'),
        status: 'draft',
        audioUrl: text.audioUrl || null,
        nuggetAudioUrl: text.nuggetAudioUrl || null,
        publishedAt: null,
      },
    };
  });
}
async function plan(tx: Tx, csv: string) {
  const rows = parseNuggets(csv);
  const existing = await tx.orm.public.Nugget.all();
  return rows.map((row) => ({
    ...row,
    action: existing.some(
      (item) =>
        item.number === row.data.number ||
        item.slug === row.data.slug ||
        item.id === row.data.id,
    )
      ? ('skip' as const)
      : ('create' as const),
  }));
}
export async function importNuggets(csv: string, preview: boolean) {
  try {
    return await db.transaction(async (tx) => {
      const rows = await plan(tx, csv);
      const create = rows.filter((row) => row.action === 'create');
      if (preview)
        return {
          nuggetsToCreate: create.length,
          skipped: rows.length - create.length,
          rows: rows.map((row) => ({
            row: row.row,
            name: row.data.title,
            type: 'nugget',
            action: row.action,
          })),
        };
      for (const row of create) await tx.orm.public.Nugget.create(row.data);
      return {
        nuggetsCreated: create.length,
        skipped: rows.length - create.length,
      };
    });
  } catch (error) {
    if (/unique constraint|duplicate key/i.test(String(error)))
      throw new ConflictException(
        'Another import changed these Nuggets. Preview the file again and retry. No items from this attempt were saved.',
      );
    throw error;
  }
}
