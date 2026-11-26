#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/13c171656d76a0c72b09bf97dd77e8d5201688678ca2e02b6e2a933381f9be67/contract';
import startContract from '../../snapshots/13c171656d76a0c72b09bf97dd77e8d5201688678ca2e02b6e2a933381f9be67/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/b79b8898358093361f3ace318273ab658c8f8cf83d1120ecbeaca50afdee5f81/contract';
import endContract from '../../snapshots/b79b8898358093361f3ace318273ab658c8f8cf83d1120ecbeaca50afdee5f81/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'Category',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('displayOrder', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('visible', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'Topic',
        column: col('categoryId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'Category',
        constraint: 'Category_name_key',
        columns: ['name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Category',
        constraint: 'Category_slug_key',
        columns: ['slug'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Topic',
        index: 'Topic_categoryId_idx_15c304f2',
        columns: ['categoryId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Topic',
        foreignKey: {
          name: 'Topic_categoryId_fkey',
          columns: ['categoryId'],
          references: { schema: 'public', table: 'Category', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
