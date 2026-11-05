#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/a8a9a406d0b56a0b1b86f9b307ad72ac16c5eee4cc11d8bc7eef052f6517b2cc/contract';
import endContract from '../../snapshots/a8a9a406d0b56a0b1b86f9b307ad72ac16c5eee4cc11d8bc7eef052f6517b2cc/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/dbd58cec1d4369d5cba813fe7da11e282f605cb4f0bd9d8b57dd870adb85f00e/contract';
import startContract from '../../snapshots/dbd58cec1d4369d5cba813fe7da11e282f605cb4f0bd9d8b57dd870adb85f00e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('role', 'text', {
          notNull: true,
          default: lit('user'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
