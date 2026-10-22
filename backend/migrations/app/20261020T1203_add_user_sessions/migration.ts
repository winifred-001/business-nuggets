#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/05fe48976e3470a967e3d430ab58ece80af8be65587024726140b2d179ddbfd1/contract';
import startContract from '../../snapshots/05fe48976e3470a967e3d430ab58ece80af8be65587024726140b2d179ddbfd1/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/4c6b5be51e0ce22f2692eea9c4845e123c5960750ad7668c8cfe210d9d233d62/contract';
import endContract from '../../snapshots/4c6b5be51e0ce22f2692eea9c4845e123c5960750ad7668c8cfe210d9d233d62/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'UserSession',
        columns: [
          col('browser', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('deviceName', 'text', {
            notNull: true,
            default: lit('Unknown device'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('expiresAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('ipAddress', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('lastSeenAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('operatingSystem', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('revokedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userAgent', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'UserSession',
        index: 'UserSession_expiresAt_idx_6b6b8c10',
        columns: ['expiresAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'UserSession',
        index: 'UserSession_revokedAt_idx_f1d8e6b3',
        columns: ['revokedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'UserSession',
        index: 'UserSession_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'UserSession',
        foreignKey: {
          name: 'UserSession_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
