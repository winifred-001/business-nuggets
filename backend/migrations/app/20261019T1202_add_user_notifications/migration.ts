#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/7bfa62b22ca888b07e108866c99f9af7a85d4e717b71921b2409ef9be5f7dcc5/contract';
import endContract from '../../snapshots/7bfa62b22ca888b07e108866c99f9af7a85d4e717b71921b2409ef9be5f7dcc5/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/fa96467d214aec24af4a947e95893db21affe6153c3976da2ad0830e07bd6867/contract';
import startContract from '../../snapshots/fa96467d214aec24af4a947e95893db21affe6153c3976da2ad0830e07bd6867/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'UserNotification',
        columns: [
          col('campaignId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('href', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('message', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('readAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', {
            notNull: true,
            default: lit('system'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'UserNotification',
        index: 'UserNotification_campaignId_idx_3aacd648',
        columns: ['campaignId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'UserNotification',
        index: 'UserNotification_createdAt_idx_9575dbd7',
        columns: ['createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'UserNotification',
        index: 'UserNotification_readAt_idx_1b4c936e',
        columns: ['readAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'UserNotification',
        index: 'UserNotification_type_idx_b6b604ea',
        columns: ['type'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'UserNotification',
        index: 'UserNotification_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'UserNotification',
        foreignKey: {
          name: 'UserNotification_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
