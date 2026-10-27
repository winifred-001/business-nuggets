import { BadRequestException } from '@nestjs/common';
import { Workbook } from 'exceljs';

export const IMPORT_LIMIT = 1024 * 1024;
export const csvCell = (value: unknown): string => {
  const text = Array.isArray(value)
    ? JSON.stringify(value)
    : String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
};
/** All formats pass through the same validation and transactional import path. */
export async function readImportFile(
  file: Express.Multer.File,
): Promise<string> {
  if (!file)
    throw new BadRequestException('Choose a CSV, Excel (.xlsx), or JSON file.');
  if (file.buffer.length > IMPORT_LIMIT)
    throw new BadRequestException('Files must be 1 MB or smaller.');
  const extension = file.originalname.toLowerCase().split('.').pop();
  if (!['csv', 'xlsx', 'json'].includes(extension || ''))
    throw new BadRequestException('Choose a CSV, Excel (.xlsx), or JSON file.');
  let csv: string;
  try {
    if (extension === 'xlsx') {
      // Bound decompressed ZIP content before ExcelJS opens the workbook.
      let expanded = 0;
      for (let i = 0; i <= file.buffer.length - 46; i++) {
        if (file.buffer.readUInt32LE(i) !== 0x02014b50) continue;
        expanded += file.buffer.readUInt32LE(i + 24);
        if (expanded > 16 * IMPORT_LIMIT)
          throw new BadRequestException(
            'Excel workbook is too large when expanded. Remove images and unused sheets.',
          );
      }
      const workbook = new Workbook();
      await workbook.xlsx.load(Uint8Array.from(file.buffer).buffer);
      const sheets = workbook.worksheets.filter(
        (sheet) => sheet.actualRowCount > 0,
      );
      if (sheets.length !== 1)
        throw new BadRequestException(
          'Use one populated worksheet per import file.',
        );
      const sheet = sheets[0];
      if (sheet.actualRowCount > 501 || sheet.columnCount > 40)
        throw new BadRequestException(
          'Use at most 500 data rows and 40 columns.',
        );
      const lines: string[] = [];
      const width = sheet.getRow(1).cellCount;
      sheet.eachRow((row) => {
        if (row.cellCount > width)
          throw new BadRequestException(
            `Excel row ${row.number}: data extends beyond the header columns.`,
          );
        lines.push(
          Array.from({ length: width }, (_, i) => {
            const cell = row.getCell(i + 1);
            if (cell.type === 6 || cell.type === 10)
              throw new BadRequestException(
                `Excel row ${row.number}: replace formulas and errors with plain values.`,
              );
            return csvCell(cell.text);
          }).join(','),
        );
      });
      csv = lines.join('\n');
    } else {
      const text = new TextDecoder('utf-8', { fatal: true })
        .decode(file.buffer)
        .replace(/^\uFEFF/, '');
      if (extension === 'csv') return text;
      const rows: unknown = JSON.parse(text);
      if (
        !Array.isArray(rows) ||
        !rows.length ||
        rows.length > 500 ||
        rows.some(
          (row) => !row || typeof row !== 'object' || Array.isArray(row),
        )
      )
        throw new BadRequestException(
          'JSON must be an array of 1–500 row objects.',
        );
      const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
      if (headers.length > 40)
        throw new BadRequestException('Use at most 40 fields per row.');
      for (const row of rows)
        for (const value of Object.values(row)) {
          if (
            value !== null &&
            typeof value === 'object' &&
            !(
              Array.isArray(value) &&
              value.every((item) => typeof item === 'string')
            )
          )
            throw new BadRequestException(
              'JSON fields must contain text, numbers, booleans, or lists of text.',
            );
        }
      csv = [
        headers.map(csvCell).join(','),
        ...rows.map((row) =>
          headers.map((header) => csvCell(row[header])).join(','),
        ),
      ].join('\n');
    }
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException(
      extension === 'xlsx'
        ? 'Could not read this Excel workbook. Save it as a valid .xlsx file and retry.'
        : 'Could not read this file. Use UTF-8 CSV or a valid JSON array of row objects.',
    );
  }
  if (Buffer.byteLength(csv) > IMPORT_LIMIT)
    throw new BadRequestException('Import data must be 1 MB or smaller.');
  return csv;
}
