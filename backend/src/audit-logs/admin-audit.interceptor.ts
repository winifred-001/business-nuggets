import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";

import {
  Observable,
  catchError,
  tap,
  throwError,
} from "rxjs";

import {
  AuditLogsService,
} from "./audit-logs.service";

@Injectable()
export class AdminAuditInterceptor
  implements NestInterceptor
{
  constructor(
    private readonly auditLogsService:
      AuditLogsService,
  ) {}

  intercept(
    context:
      ExecutionContext,

    next:
      CallHandler,
  ): Observable<any> {
    const request =
      context
        .switchToHttp()
        .getRequest();

    const method =
      String(
        request.method ??
          "",
      ).toUpperCase();

    /*
     * We only record actions that
     * actually change something.
     */
    if (
      ![
        "POST",
        "PATCH",
        "PUT",
        "DELETE",
      ].includes(method)
    ) {
      return next.handle();
    }

    const path =
      request.originalUrl ??
      request.url ??
      "";

    const user =
      request.user;

    const body =
      request.body ??
      {};

    const {
      action,
      target,
    } =
      this.describeAction(
        method,
        path,
        body,
      );

    return next.handle().pipe(
      tap(() => {
        void this.auditLogsService.createLog({
          adminId:
            user?.sub ??
            null,

          adminEmail:
            user?.email ??
            null,

          action,

          target,

          method,

          path,

          result:
            "success",
        });
      }),

      catchError(
        (error) => {
          void this.auditLogsService.createLog({
            adminId:
              user?.sub ??
              null,

            adminEmail:
              user?.email ??
              null,

            action,

            target,

            method,

            path,

            result:
              "failed",
          });

          return throwError(
            () => error,
          );
        },
      ),
    );
  }

  private describeAction(
    method: string,
    path: string,
    body: any,
  ) {
    const cleanPath =
      path.split("?")[0];

    const importPath = cleanPath.match(/^\/admin\/(nuggets|topics)\/import(\/preview)?$/);
    if (method === "POST" && importPath) {
      return {
        action: importPath[2] ? "Previewed content import" : "Imported content",
        target: importPath[1] === "nuggets" ? "Nuggets" : "Topics & Categories",
      };
    }

    /* NUGGETS */

    if (
      cleanPath.includes(
        "/admin/nuggets",
      )
    ) {
      if (
        method ===
        "POST"
      ) {
        return {
          action:
            "Created nugget",

          target:
            body.title ??
            null,
        };
      }

      if (
        method ===
        "DELETE"
      ) {
        return {
          action:
            "Deleted nugget",

          target:
            this.lastPathPart(
              cleanPath,
            ),
        };
      }

      return {
        action:
          body.status ===
          "published"
            ? "Published nugget"
            : "Updated nugget",

        target:
          body.title ??
          this.lastPathPart(
            cleanPath,
          ),
      };
    }

    /* TOPICS */

    if (
      cleanPath.includes(
        "/admin/topics",
      )
    ) {
      return {
        action:
          method === "POST"
            ? "Created topic"
            : "Updated topic",

        target:
          body.name ??
          null,
      };
    }

    /* SCRIPTURE */

    if (
      cleanPath.includes(
        "/admin/scripture",
      )
    ) {
      return {
        action:
          method === "POST"
            ? "Created scripture book"
            : "Updated scripture book",

        target:
          body.name ??
          null,
      };
    }

    /* SCHEDULE */

    if (
      cleanPath.includes(
        "/admin/schedule",
      )
    ) {
      return {
        action:
          method === "DELETE"
            ? "Removed schedule"
            : "Updated schedule",

        target:
          body.nuggetId ??
          null,
      };
    }

    /* MEDIA */

    if (
      cleanPath.includes(
        "/admin/media",
      )
    ) {
      if (
        cleanPath.includes(
          "/upload",
        )
      ) {
        return {
          action:
            "Uploaded media",

          target:
            null,
        };
      }

      if (
        method ===
        "DELETE"
      ) {
        return {
          action:
            "Deleted media",

          target:
            this.lastPathPart(
              cleanPath,
            ),
        };
      }

      return {
        action:
          "Updated media",

        target:
          null,
      };
    }

    /* USERS */

    if (
      cleanPath.includes(
        "/admin/users",
      )
    ) {
      return {
        action:
          method === "POST"
            ? "Created user"
            : "Updated user",

        target:
          body.email ??
          null,
      };
    }

    /* SUBSCRIPTIONS */

    if (
      cleanPath.includes(
        "/admin/subscriptions",
      )
    ) {
      return {
        action:
          method === "POST"
            ? "Created plan"
            : "Updated plan",

        target:
          body.name ??
          null,
      };
    }

    /* MODERATION */

    if (
      cleanPath.includes(
        "/admin/moderation",
      )
    ) {
      if (
        cleanPath.includes(
          "/reply",
        )
      ) {
        return {
          action:
            "Replied to comment",

          target:
            this.getRouteId(
              cleanPath,
              "moderation",
            ),
        };
      }

      if (
        cleanPath.includes(
          "/bulk",
        )
      ) {
        return {
          action:
            "Bulk moderated comments",

          target:
            body.action ??
            null,
        };
      }

      if (
        body.status ===
        "approved"
      ) {
        return {
          action:
            "Approved comment",

          target:
            this.getRouteId(
              cleanPath,
              "moderation",
            ),
        };
      }

      if (
        body.status ===
        "rejected"
      ) {
        return {
          action:
            "Rejected comment",

          target:
            this.getRouteId(
              cleanPath,
              "moderation",
            ),
        };
      }

      return {
        action:
          "Updated comment",

        target:
          this.getRouteId(
            cleanPath,
            "moderation",
          ),
      };
    }

    /* MOBILE */

    if (
      cleanPath.includes(
        "/admin/mobile",
      )
    ) {
      return {
        action:
          cleanPath.includes(
            "/settings",
          )
            ? "Published mobile settings"
            : "Updated mobile app",

        target:
          null,
      };
    }

    /* NOTIFICATIONS */

    if (
      cleanPath.includes(
        "/admin/notifications",
      )
    ) {
      return {
        action:
          method === "POST"
            ? "Scheduled notification"
            : "Updated notification",

        target:
          body.title ??
          null,
      };
    }

    /* ROLES */

    if (
      cleanPath.includes(
        "/admin/roles",
      )
    ) {
      return {
        action:
          method === "POST"
            ? "Created admin"
            : "Changed admin access",

        target:
          body.email ??
          this.lastPathPart(
            cleanPath,
          ),
      };
    }

    /* SETTINGS LATER */

    if (
      cleanPath.includes(
        "/admin/settings",
      )
    ) {
      return {
        action:
          "Updated settings",

        target:
          null,
      };
    }

    /* FALLBACK */

    return {
      action:
        `${method} admin action`,

      target:
        cleanPath,
    };
  }

  private lastPathPart(
    path: string,
  ) {
    const parts =
      path
        .split("/")
        .filter(Boolean);

    return (
      parts[
        parts.length -
          1
      ] ?? null
    );
  }

  private getRouteId(
    path: string,
    section: string,
  ) {
    const parts =
      path
        .split("/")
        .filter(Boolean);

    const index =
      parts.indexOf(
        section,
      );

    if (
      index === -1
    ) {
      return null;
    }

    return (
      parts[
        index + 1
      ] ?? null
    );
  }
}