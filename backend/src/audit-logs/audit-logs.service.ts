import {
  Injectable,
} from "@nestjs/common";

import { db } from "../prisma/db";

@Injectable()
export class AuditLogsService {
  /* =========================================================
     CREATE LOG
  ========================================================= */

  async createLog(data: {
    adminId?: number | null;
    adminEmail?: string | null;

    action: string;
    target?: string | null;

    method: string;
    path: string;

    result:
      | "success"
      | "failed";
  }) {
    /*
     * Audit logging should never break
     * the actual admin request.
     */
    try {
      await db.orm.public.AuditLog.create({
        adminId:
          data.adminId ??
          null,

        adminEmail:
          data.adminEmail ??
          null,

        action:
          data.action,

        target:
          data.target ??
          null,

        method:
          data.method,

        path:
          data.path,

        result:
          data.result,
      });
    } catch (error) {
      console.error(
        "Could not write audit log:",
        error,
      );
    }
  }

  /* =========================================================
     ADMIN LIST
  ========================================================= */

  async getLogs() {
    const [
      logs,
      users,
    ] =
      await Promise.all([
        db.orm.public.AuditLog.all(),

        db.orm.public.User.all(),
      ]);

    return logs
      .map((log) => {
        const admin =
          log.adminId
            ? users.find(
                (user) =>
                  user.id ===
                  log.adminId,
              )
            : null;

        return {
          ...log,

          adminName:
            admin?.name ??
            log.adminEmail ??
            "Unknown",
        };
      })
      .sort(
        (a, b) =>
          new Date(
            b.createdAt,
          ).getTime() -
          new Date(
            a.createdAt,
          ).getTime(),
      );
  }
}