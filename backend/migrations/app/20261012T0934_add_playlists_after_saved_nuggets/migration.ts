#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/1380ca6380dfa8bb77874bf31153b18efe9c30f53a2bd381ed140da062a677fa/contract';
import endContract from '../../snapshots/1380ca6380dfa8bb77874bf31153b18efe9c30f53a2bd381ed140da062a677fa/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/5d626ef7f0d5407a9ff132e1e3b3ac4b38204c865f9baa31783fe97b858de2cd/contract';
import startContract from '../../snapshots/5d626ef7f0d5407a9ff132e1e3b3ac4b38204c865f9baa31783fe97b858de2cd/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'Playlist',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'PlaylistItem',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nuggetId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('playlistId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Playlist',
        constraint: 'Playlist_userId_name_key',
        columns: ['userId', 'name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'PlaylistItem',
        constraint: 'PlaylistItem_playlistId_nuggetId_key',
        columns: ['playlistId', 'nuggetId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Playlist',
        index: 'Playlist_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PlaylistItem',
        index: 'PlaylistItem_playlistId_idx_470a517f',
        columns: ['playlistId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Playlist',
        foreignKey: {
          name: 'Playlist_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PlaylistItem',
        foreignKey: {
          name: 'PlaylistItem_playlistId_fkey',
          columns: ['playlistId'],
          references: { schema: 'public', table: 'Playlist', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
