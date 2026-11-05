#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2fa024d60b3abf27155a8fa80c46e2046dfa144c307bad36cf850a085acee901/contract';
import endContract from '../../snapshots/2fa024d60b3abf27155a8fa80c46e2046dfa144c307bad36cf850a085acee901/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/4c6b5be51e0ce22f2692eea9c4845e123c5960750ad7668c8cfe210d9d233d62/contract';
import startContract from '../../snapshots/4c6b5be51e0ce22f2692eea9c4845e123c5960750ad7668c8cfe210d9d233d62/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'AppSettings',
        column: col('ipAllowList', 'text[]', {
          notNull: true,
          default: lit([]),
          codecRef: { codecId: 'pg/text@1', many: true },
        }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'AppSettings',
        constraint: 'AppSettings_ipAllowList_elem_not_null_788ceb17',
        expression: 'array_position("ipAllowList", NULL) IS NULL',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
