#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/2fa024d60b3abf27155a8fa80c46e2046dfa144c307bad36cf850a085acee901/contract';
import startContract from '../../snapshots/2fa024d60b3abf27155a8fa80c46e2046dfa144c307bad36cf850a085acee901/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/8bf52eabebde71d120be2b40825064b1ee6f812838d7837e4e658a8af518a3cc/contract';
import endContract from '../../snapshots/8bf52eabebde71d120be2b40825064b1ee6f812838d7837e4e658a8af518a3cc/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('twoFactorEnabled', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('twoFactorSecret', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
