import { Workbook } from 'exceljs';
import { readImportFile, csvCell } from './import-file';
import { parseNuggets } from './nugget-import';
import { splitHierarchy } from './hierarchy-import';

jest.mock('../prisma/db', () => ({ db: {} }));

const row = {
  number: '313', title: 'Flee from sexual immorality', topic: 'Enterprise Integrity',
  'Scripture Reference': '1 Corinthians 6:18-20',
  'Scripture Text': 'First paragraph.\n\nSecond paragraph with **bold text**.',
  'Key Principles and Boundaries': 'Principle, with boundaries.',
  'Explanation: Full Biblical Context and Teaching': 'Full context.\n\nMore teaching.',
  'Marketplace Application': 'Application, kept separate.',
  'Practical Action Plan': ['First action, with a comma.', 'Second action.'],
  'Challenges & Reflection': ['What will I change, and when?', 'Who will review it?'],
};
const csv = (rows: Record<string, unknown>[]) => {
  const headers = [...new Set(rows.flatMap(Object.keys))];
  return [headers.map(csvCell).join(','), ...rows.map(r => headers.map(h => csvCell(r[h] ?? '')).join(','))].join('\n');
};

describe('Nugget section import mapping', () => {
  it.each(['csv', 'json', 'xlsx'])('maps %s section headings without mixing content', async extension => {
    let buffer: Buffer;
    if (extension === 'xlsx') {
      const workbook = new Workbook();
      const sheet = workbook.addWorksheet('Nuggets');
      sheet.addRow(Object.keys(row));
      sheet.addRow(Object.values(row).map(value => Array.isArray(value) ? JSON.stringify(value) : value));
      buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    } else buffer = Buffer.from(extension === 'json' ? JSON.stringify([row]) : csv([row]));
    const text = await readImportFile({ originalname: `nuggets.${extension}`, buffer } as Express.Multer.File);
    const [result] = parseNuggets(text);
    expect(result.data).toMatchObject({
      number: 313, scriptureRef: row['Scripture Reference'], scriptureText: row['Scripture Text'],
      keyPrinciple: row['Key Principles and Boundaries'], details: row['Explanation: Full Biblical Context and Teaching'],
      marketplaceApplication: row['Marketplace Application'], practicalActionPlan: row['Practical Action Plan'],
      challenges: row['Challenges & Reflection'], status: 'draft',
    });
  });
  it('maps the same section headings in a mixed taxonomy import', () => {
    const result = splitHierarchy(csv([
      { type: 'category', name: 'Integrity' },
      { type: 'topic', name: row.topic, category: 'Integrity' },
      { type: 'nugget', ...row },
    ]), 'topics');
    expect(result.taxonomy).toHaveLength(2);
    expect(result.nuggets[0].data.details).toBe(row['Explanation: Full Biblical Context and Teaching']);
    expect(result.nuggets[0].data.challenges).toEqual(row['Challenges & Reflection']);
  });
  it('preserves legacy field names and newline lists, including sentence commas', () => {
    const [result] = parseNuggets(csv([{ number: '1', title: 'Legacy', topic: 'Work',
      keyPrinciple: '**Principle**', details: 'Explanation', challenges: 'One, intact prompt\nAnother prompt',
      practicalActionPlan: 'Do one thing\nThen another', songUrl: 'https://example.test/song.mp3' }]));
    expect(result.data).toMatchObject({ keyPrinciple: '**Principle**', details: 'Explanation',
      challenges: ['One, intact prompt', 'Another prompt'], practicalActionPlan: ['Do one thing', 'Then another'],
      audioUrl: 'https://example.test/song.mp3' });
  });
  it('rejects duplicate aliases instead of silently overwriting a section', () => {
    expect(() => parseNuggets(csv([{ ...row, details: 'Conflicting explanation' }]))).toThrow();
    expect(() => splitHierarchy(csv([{ type: 'nugget', ...row, details: 'Conflict' }]), 'topics')).toThrow();
  });
});
