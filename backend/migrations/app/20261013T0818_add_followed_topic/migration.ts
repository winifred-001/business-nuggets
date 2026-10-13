#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/7bde660f9f367e5ff40650bafce2b326bf0d421e6f1a8b1be026fa1b33e100ce/contract';
import startContract from '../../snapshots/7bde660f9f367e5ff40650bafce2b326bf0d421e6f1a8b1be026fa1b33e100ce/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/dbd58cec1d4369d5cba813fe7da11e282f605cb4f0bd9d8b57dd870adb85f00e/contract';
import endContract from '../../snapshots/dbd58cec1d4369d5cba813fe7da11e282f605cb4f0bd9d8b57dd870adb85f00e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'FollowedTopic',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('topic', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'FollowedTopic',
        constraint: 'FollowedTopic_userId_topic_key',
        columns: ['userId', 'topic'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'FollowedTopic',
        index: 'FollowedTopic_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'FollowedTopic',
        foreignKey: {
          name: 'FollowedTopic_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
