#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/0ffc7df3daa3962cf9d1d915c99ae46ffc03fef47dc0289300e0febdefef859b/contract';
import startContract from '../../snapshots/0ffc7df3daa3962cf9d1d915c99ae46ffc03fef47dc0289300e0febdefef859b/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/b1df6bc073a3a9d51b79beb4ab7dfa61cd90e81f4108f57a8a39c7e604816675/contract';
import endContract from '../../snapshots/b1df6bc073a3a9d51b79beb4ab7dfa61cd90e81f4108f57a8a39c7e604816675/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'PushDeviceToken',
        columns: [
          col('active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('deviceName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('lastSeenAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('platform', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('token', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'PushDeviceToken',
        constraint: 'PushDeviceToken_token_key',
        columns: ['token'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PushDeviceToken',
        index: 'PushDeviceToken_active_idx_8af4daed',
        columns: ['active'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PushDeviceToken',
        index: 'PushDeviceToken_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PushDeviceToken',
        foreignKey: {
          name: 'PushDeviceToken_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
