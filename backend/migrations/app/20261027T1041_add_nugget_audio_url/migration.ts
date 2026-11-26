#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/13c171656d76a0c72b09bf97dd77e8d5201688678ca2e02b6e2a933381f9be67/contract';
import endContract from '../../snapshots/13c171656d76a0c72b09bf97dd77e8d5201688678ca2e02b6e2a933381f9be67/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/b1df6bc073a3a9d51b79beb4ab7dfa61cd90e81f4108f57a8a39c7e604816675/contract';
import startContract from '../../snapshots/b1df6bc073a3a9d51b79beb4ab7dfa61cd90e81f4108f57a8a39c7e604816675/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Nugget',
        column: col('nuggetAudioUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
