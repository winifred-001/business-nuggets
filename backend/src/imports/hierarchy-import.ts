import { BadRequestException, ConflictException } from '@nestjs/common';
import { db } from '../prisma/db';
import { TopicsService } from '../topics/topics.service';
import {
  parseCsvRecords,
  parseTaxonomyCsv,
  taxonomyKey,
  type TaxonomyRow,
} from '../topics/topics-csv';
import { csvCell } from './import-file';
import { parseNuggets } from './nugget-import';

const columnKey = (value: string) => value.toLowerCase().replace(/[\s_-]/g, '');
/** Flat rows support taxonomy alone, Nuggets alone, or all three levels with a type column. */
export function splitHierarchy(csv: string, kind: 'topics' | 'nuggets') {
  if (kind === 'nuggets')
    return { taxonomy: [] as TaxonomyRow[], nuggets: parseNuggets(csv) };
  const records = parseCsvRecords(csv);
  const headers = records.shift()!.fields;
  const keys = headers
    .map(columnKey)
    .map((key) => (key === 'briefdescription' ? 'description' : key));
  if (
    !keys.includes('type') ||
    !keys.some((key) => ['number', 'title', 'topic'].includes(key))
  )
    return {
      taxonomy: parseTaxonomyCsv(csv),
      nuggets: [] as ReturnType<typeof parseNuggets>,
    };
  const allowed = new Set([
    'type',
    'name',
    'description',
    'briefdescription',
    'visible',
    'number',
    'slug',
    'title',
    'topic',
    'category',
    'tag',
    'scriptureref',
    'scripturetext',
    'image',
    'keyprinciple',
    'marketplaceapplication',
    'practicalactionplan',
    'duration',
    'isgold',
    'book',
    'biblesection',
    'challenges',
    'featured',
    'songurl',
    'nuggeturl',
    'audiourl',
    'nuggetaudiourl',
    'status',
  ]);
  if (
    new Set(keys).size !== keys.length ||
    keys.some((key) => !allowed.has(key))
  )
    throw new BadRequestException(
      'Unknown or duplicate hierarchy columns. Download the hierarchy template.',
    );
  const taxonomyRecords = records.filter((record) =>
    ['topic', 'category'].includes(
      taxonomyKey(record.fields[keys.indexOf('type')] || ''),
    ),
  );
  const nuggetRecords = records.filter(
    (record) =>
      taxonomyKey(record.fields[keys.indexOf('type')] || '') === 'nugget',
  );
  for (const record of records) {
    if (
      record.fields.length !== headers.length ||
      !['topic', 'category', 'nugget'].includes(
        taxonomyKey(record.fields[keys.indexOf('type')] || ''),
      )
    )
      throw new BadRequestException(
        `Row ${record.line}: use type category, topic, or nugget and match the header columns.`,
      );
  }
  const encode = (selected: typeof records, columns: string[]) =>
    [
      columns.map(csvCell).join(','),
      ...selected.map((record) =>
        columns
          .map((column) => {
            const index = keys.indexOf(columnKey(column));
            return csvCell(index < 0 ? '' : record.fields[index]);
          })
          .join(','),
      ),
    ].join('\n');
  const taxonomy = taxonomyRecords.length
    ? parseTaxonomyCsv(
        encode(taxonomyRecords, [
          'type',
          'name',
          'description',
          'category',
          'visible',
        ]),
      ).map((row, i) => ({ ...row, row: taxonomyRecords[i].line }))
    : [];
  const nuggetHeaders = headers.filter(
    (_, i) =>
      !['type', 'name', 'description', 'briefdescription', 'visible'].includes(
        keys[i],
      ),
  );
  const nuggets = nuggetRecords.length
    ? parseNuggets(encode(nuggetRecords, nuggetHeaders)).map((row, i) => ({
        ...row,
        row: nuggetRecords[i].line,
      }))
    : [];
  return { taxonomy, nuggets };
}
export async function importHierarchy(
  csv: string,
  preview: boolean,
  kind: 'topics' | 'nuggets',
  taxonomy = new TopicsService(),
) {
  const parsed = splitHierarchy(csv, kind);
  try {
    return await db.transaction(async (tx) => {
      const existing = await tx.orm.public.Nugget.all();
      const nuggets = parsed.nuggets.map((row) => ({
        ...row,
        action: existing.some(
          (item) =>
            item.number === row.data.number ||
            item.slug === row.data.slug ||
            item.id === row.data.id,
        )
          ? 'skip'
          : 'create',
      }));
      const newNuggets = nuggets.filter((row) => row.action === 'create');
      const rows = parsed.taxonomy.map((row) => ({ ...row }));
      for (const nugget of newNuggets) {
        const matching = rows.find(
          (row) =>
            row.type === 'topic' &&
            taxonomyKey(row.name) === taxonomyKey(nugget.data.topic),
        );
        if (matching) {
          if (
            matching.category &&
            nugget.category &&
            taxonomyKey(matching.category) !== taxonomyKey(nugget.category)
          )
            throw new BadRequestException(
              `Row ${nugget.row}: topic "${matching.name}" has conflicting categories in this file.`,
            );
          matching.category ||= nugget.category;
        } else
          rows.push({
            row: nugget.row,
            type: 'topic',
            name: nugget.data.topic,
            description: '',
            category: nugget.category,
            visible: true,
          });
      }
      const plan = await taxonomy.planImport(tx, rows);
      const assignments: {
        id: number;
        name: string;
        category: string;
        row: number;
      }[] = [];
      // A supplied category may fill an uncategorized topic, but never silently move one.
      for (const row of rows.filter(
        (row) => row.type === 'topic' && row.category,
      )) {
        const topic = plan.topics.find(
          (topic) => taxonomyKey(topic.name) === taxonomyKey(row.name),
        );
        if (!topic) continue;
        if (topic.categoryId !== null) {
          const current = plan.categories.find(
            (category) => category.id === topic.categoryId,
          );
          if (
            !current ||
            taxonomyKey(current.name) !== taxonomyKey(row.category)
          )
            throw new ConflictException(
              `Row ${row.row}: topic "${topic.name}" already belongs to "${current?.name || 'another category'}". Move the topic in the editor first.`,
            );
        } else
          assignments.push({
            id: topic.id,
            name: topic.name,
            category: row.category,
            row: row.row,
          });
      }
      // Re-run category/slug validation with explicit rows for those categories.
      const extraCategories = assignments
        .filter(
          (assignment) =>
            !rows.some(
              (row) =>
                row.type === 'category' &&
                taxonomyKey(row.name) === taxonomyKey(assignment.category),
            ),
        )
        .map((assignment) => ({
          row: assignment.row,
          type: 'category' as const,
          name: assignment.category,
          description: '',
          category: '',
          visible: true,
        }));
      const finalRows = [...rows];
      for (const row of extraCategories)
        if (
          !finalRows.some(
            (item) =>
              item.type === 'category' &&
              taxonomyKey(item.name) === taxonomyKey(row.name),
          )
        )
          finalRows.push(row);
      const finalPlan = extraCategories.length
        ? await taxonomy.planImport(tx, finalRows)
        : plan;
      const assignmentIds = new Set(
        assignments.map((assignment) => assignment.id),
      );
      const taxonomyPreview = finalPlan.preview.rows.map((row) => {
        const topic = finalPlan.topics.find(
          (topic) => taxonomyKey(topic.name) === taxonomyKey(row.name),
        );
        return {
          ...row,
          action:
            row.type === 'topic' && topic && assignmentIds.has(topic.id)
              ? 'assign'
              : row.action,
        };
      });
      const skipped =
        taxonomyPreview.filter((row) => row.action === 'skip').length +
        nuggets.filter((row) => row.action === 'skip').length;
      const topicNames = new Map(
        finalPlan.topics.map((topic) => [taxonomyKey(topic.name), topic.name]),
      );
      const nuggetPreview = nuggets.map((row) => ({
        row: row.row,
        type: 'nugget',
        name: row.data.title,
        topic: topicNames.get(taxonomyKey(row.data.topic)) || row.data.topic,
        category:
          row.category ||
          rows.find(
            (item) =>
              item.type === 'topic' &&
              taxonomyKey(item.name) === taxonomyKey(row.data.topic),
          )?.category ||
          finalPlan.categories.find(
            (category) =>
              category.id ===
              finalPlan.topics.find(
                (topic) =>
                  taxonomyKey(topic.name) === taxonomyKey(row.data.topic),
              )?.categoryId,
          )?.name ||
          '',
        action: row.action,
      }));
      if (preview)
        return {
          categoriesToCreate: finalPlan.plannedCategories.size,
          topicsToCreate: finalPlan.plannedTopics.length,
          topicsToAssign: assignments.length,
          nuggetsToCreate: newNuggets.length,
          skipped,
          rows: [...taxonomyPreview, ...nuggetPreview],
        };
      await taxonomy.saveImport(tx, finalPlan);
      const categories = await tx.orm.public.Category.all();
      for (const assignment of assignments) {
        const category = categories.find(
          (category) =>
            taxonomyKey(category.name) === taxonomyKey(assignment.category),
        );
        if (!category)
          throw new ConflictException(
            'Category could not be created. Nothing was imported.',
          );
        await tx.orm.public.Topic.where({ id: assignment.id }).update({
          categoryId: category.id,
        });
      }
      for (const row of newNuggets)
        await tx.orm.public.Nugget.create({
          ...row.data,
          topic:
            topicNames.get(taxonomyKey(row.data.topic)) ||
            rows.find(
              (item) =>
                item.type === 'topic' &&
                taxonomyKey(item.name) === taxonomyKey(row.data.topic),
            )?.name ||
            row.data.topic,
        });
      return {
        categoriesCreated: finalPlan.plannedCategories.size,
        topicsCreated: finalPlan.plannedTopics.length,
        topicsAssigned: assignments.length,
        nuggetsCreated: newNuggets.length,
        skipped,
      };
    });
  } catch (error) {
    if (/unique constraint|duplicate key/i.test(String(error)))
      throw new ConflictException(
        'Content changed during this import. Preview again and retry. No items from this attempt were saved.',
      );
    throw error;
  }
}

export async function importNuggets(csv: string, preview: boolean) {
  return importHierarchy(csv, preview, 'nuggets');
}
