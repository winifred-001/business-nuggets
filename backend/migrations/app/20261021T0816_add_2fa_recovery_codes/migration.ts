#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/0ffc7df3daa3962cf9d1d915c99ae46ffc03fef47dc0289300e0febdefef859b/contract';
import endContract from '../../snapshots/0ffc7df3daa3962cf9d1d915c99ae46ffc03fef47dc0289300e0febdefef859b/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/8bf52eabebde71d120be2b40825064b1ee6f812838d7837e4e658a8af518a3cc/contract';
import startContract from '../../snapshots/8bf52eabebde71d120be2b40825064b1ee6f812838d7837e4e658a8af518a3cc/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('twoFactorRecoveryCodes', 'text[]', {
          notNull: true,
          default: lit([]),
          codecRef: { codecId: 'pg/text@1', many: true },
        }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'User',
        constraint: 'User_twoFactorRecoveryCodes_elem_not_null_4a22bcfa',
        expression: 'array_position("twoFactorRecoveryCodes", NULL) IS NULL',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
