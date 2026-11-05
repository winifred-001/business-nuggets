#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/a8a9a406d0b56a0b1b86f9b307ad72ac16c5eee4cc11d8bc7eef052f6517b2cc/contract';
import startContract from '../../snapshots/a8a9a406d0b56a0b1b86f9b307ad72ac16c5eee4cc11d8bc7eef052f6517b2cc/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/ced9ba127d45a2a90039c9119e10047a9a46ae74a4ee72a669358f18f1a3b67a/contract';
import endContract from '../../snapshots/ced9ba127d45a2a90039c9119e10047a9a46ae74a4ee72a669358f18f1a3b67a/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'Nugget',
        columns: [
          col('audioUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('bibleSection', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('book', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('challenges', 'text[]', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1', many: true },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('duration', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('featured', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('image', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isGold', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('keyPrinciple', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('marketplaceApplication', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('number', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('practicalActionPlan', 'text[]', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1', many: true },
          }),
          col('publishedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('scriptureRef', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('scriptureText', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('draft'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('tag', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('topic', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Nugget_challenges_elem_not_null_8c29d25c',
            'array_position("challenges", NULL) IS NULL',
          ),
          checkExpression(
            'Nugget_practicalActionPlan_elem_not_null_d53b649f',
            'array_position("practicalActionPlan", NULL) IS NULL',
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Nugget',
        constraint: 'Nugget_slug_key',
        columns: ['slug'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Nugget',
        constraint: 'Nugget_number_key',
        columns: ['number'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
