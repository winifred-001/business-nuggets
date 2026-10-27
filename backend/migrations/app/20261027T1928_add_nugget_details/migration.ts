#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/49d7923478ba7c0f9de920943c5e3a547e2aa94d454c432f5d9feffe9735b132/contract';
import endContract from '../../snapshots/49d7923478ba7c0f9de920943c5e3a547e2aa94d454c432f5d9feffe9735b132/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/b79b8898358093361f3ace318273ab658c8f8cf83d1120ecbeaca50afdee5f81/contract';
import startContract from '../../snapshots/b79b8898358093361f3ace318273ab658c8f8cf83d1120ecbeaca50afdee5f81/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Nugget',
        column: col('details', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
