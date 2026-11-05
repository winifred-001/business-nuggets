#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/5d626ef7f0d5407a9ff132e1e3b3ac4b38204c865f9baa31783fe97b858de2cd/contract';
import endContract from '../../snapshots/5d626ef7f0d5407a9ff132e1e3b3ac4b38204c865f9baa31783fe97b858de2cd/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/66ed1da0a394ba1b4838218d2c2956dffc088c50a8e4f0e72f92d8013c97121d/contract';
import startContract from '../../snapshots/66ed1da0a394ba1b4838218d2c2956dffc088c50a8e4f0e72f92d8013c97121d/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'SavedNugget',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nuggetId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'SavedNugget',
        constraint: 'SavedNugget_userId_nuggetId_key',
        columns: ['userId', 'nuggetId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SavedNugget',
        index: 'SavedNugget_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'SavedNugget',
        foreignKey: {
          name: 'SavedNugget_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
