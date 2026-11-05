#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/05fe48976e3470a967e3d430ab58ece80af8be65587024726140b2d179ddbfd1/contract';
import endContract from '../../snapshots/05fe48976e3470a967e3d430ab58ece80af8be65587024726140b2d179ddbfd1/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/7bfa62b22ca888b07e108866c99f9af7a85d4e717b71921b2409ef9be5f7dcc5/contract';
import startContract from '../../snapshots/7bfa62b22ca888b07e108866c99f9af7a85d4e717b71921b2409ef9be5f7dcc5/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.setDefault({
        schema: 'public',
        table: 'NotificationCampaign',
        column: col('channel', 'text', {
          default: lit('in-app'),
          codecRef: { codecId: 'pg/text@1' },
        }),
        operationClass: 'widening',
      }),
      this.createIndex({
        schema: 'public',
        table: 'UserNotification',
        index: 'UserNotification_userId_campaignId_idx_86a84a2d',
        columns: ['userId', 'campaignId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
