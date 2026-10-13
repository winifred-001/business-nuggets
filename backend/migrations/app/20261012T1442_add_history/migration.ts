#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/09b7a7ec8083b8aef364d660a60f52ac2a5450524c332688301fa84f5944863f/contract';
import startContract from '../../snapshots/09b7a7ec8083b8aef364d660a60f52ac2a5450524c332688301fa84f5944863f/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/7bde660f9f367e5ff40650bafce2b326bf0d421e6f1a8b1be026fa1b33e100ce/contract';
import endContract from '../../snapshots/7bde660f9f367e5ff40650bafce2b326bf0d421e6f1a8b1be026fa1b33e100ce/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'History',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('lastOpenedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('nuggetId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('progress', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'History',
        constraint: 'History_userId_nuggetId_key',
        columns: ['userId', 'nuggetId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'History',
        index: 'History_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'History',
        foreignKey: {
          name: 'History_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
