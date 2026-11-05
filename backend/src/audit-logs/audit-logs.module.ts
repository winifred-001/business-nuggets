import {
  Module,
} from "@nestjs/common";

import {
  AdminAuditInterceptor,
} from "./admin-audit.interceptor";

import {
  AuditLogsService,
} from "./audit-logs.service";

@Module({
  providers: [
    AuditLogsService,
    AdminAuditInterceptor,
  ],

  exports: [
    AuditLogsService,
    AdminAuditInterceptor,
  ],
})
export class AuditLogsModule {}