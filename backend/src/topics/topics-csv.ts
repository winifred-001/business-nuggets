import { BadRequestException } from '@nestjs/common';
export type TaxonomyRow = {
  row: number;
  type: 'topic' | 'category';
  name: string;
  description: string;
  category: string;
  visible: boolean;
};
export const taxonomyKey = (value: string) => value.trim().toLowerCase();
export const taxonomySlug = (value: string) =>
  taxonomyKey(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
/** RFC-style quoted fields, including embedded commas/newlines and escaped quotes. */
export function parseTaxonomyCsv(csv: string): TaxonomyRow[] {
  if (Buffer.byteLength(csv, 'utf8') > 1024 * 1024)
    throw new BadRequestException('CSV files must be 1 MB or smaller.');
  csv = csv.replace(/^\uFEFF/, '');
  const records: { line: number; fields: string[] }[] = [];
  let fields: string[] = [],
    field = '',
    quoted = false,
    closed = false,
    line = 1,
    rowLine = 1;
  const fail = (message: string): never => {
    throw new BadRequestException(`CSV row ${rowLine}: ${message}`);
  };
  function finishField() {
    fields.push(field.trim());
    field = '';
    closed = false;
  }
  function finishRow() {
    finishField();
    if (fields.some(Boolean)) records.push({ line: rowLine, fields });
    fields = [];
  }
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (quoted) {
      if (char === '"') {
        if (csv[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else {
        field += char;
        if (char === '\n') line++;
      }
      continue;
    }
    if (char === ',') {
      finishField();
      continue;
    }
    if (char === '\n' || char === '\r') {
      finishRow();
      if (char === '\r' && csv[i + 1] === '\n') i++;
      line++;
      rowLine = line;
      if (records.length > 501) fail('Maximum 500 data rows.');
      continue;
    }
    if (closed) {
      if (!/\s/.test(char)) fail('Unexpected text after a closing quote.');
      continue;
    }
    if (char === '"') {
      if (field.trim()) fail('Quotes must surround an entire field.');
      field = '';
      quoted = true;
    } else field += char;
  }
  if (quoted) fail('A quoted field was not closed.');
  finishRow();
  if (records.length < 2)
    throw new BadRequestException(
      'CSV must contain a header and at least one data row.',
    );
  const headers = records.shift()!.fields.map(taxonomyKey);
  const allowed = ['type', 'name', 'description', 'category', 'visible'];
  if (
    new Set(headers).size !== headers.length ||
    headers.some((name) => !allowed.includes(name)) ||
    !headers.includes('type') ||
    !headers.includes('name')
  )
    throw new BadRequestException(
      'Use CSV headers: type,name,description,category,visible. The type and name columns are required.',
    );
  if (records.length > 500)
    throw new BadRequestException('CSV can contain at most 500 data rows.');
  const seen = new Set<string>();
  return records.map((record) => {
    rowLine = record.line;
    if (record.fields.length !== headers.length)
      fail(
        'The number of fields does not match the header. Quote text containing commas.',
      );
    const values = Object.fromEntries(
      headers.map((header, i) => [header, record.fields[i]]),
    );
    const type = taxonomyKey(values.type);
    if (type !== 'topic' && type !== 'category')
      fail('Type must be topic or category.');
    if (!values.name || values.name.length > 120 || !taxonomySlug(values.name))
      fail('Name must be 1–120 characters and contain letters or numbers.');
    if ((values.description || '').length > 1000)
      fail('Description must be 1000 characters or fewer.');
    if (
      (values.category || '').length > 120 ||
      (values.category && !taxonomySlug(values.category))
    )
      fail('Category must be a valid name of 120 characters or fewer.');
    if (type === 'category' && values.category)
      fail('Category rows cannot belong to another category.');
    const visible = taxonomyKey(values.visible || 'true');
    if (!['true', 'false', 'yes', 'no', '1', '0'].includes(visible))
      fail('Visible must be true or false.');
    const key = `${type}:${taxonomySlug(values.name)}`;
    if (seen.has(key)) fail(`Duplicate ${type} name or URL slug in this file.`);
    seen.add(key);
    return {
      row: record.line,
      type: type as 'topic' | 'category',
      name: values.name,
      description: values.description || '',
      category: values.category || '',
      visible: ['true', 'yes', '1'].includes(visible),
    };
  });
}
