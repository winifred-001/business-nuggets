import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { db } from "../prisma/db";

type ModerationStatus =
  | "pending"
  | "approved"
  | "flagged"
  | "rejected";

@Injectable()
export class ModerationService {
  private commentReportsTableReady = false;

  private async ensureCommentReportsTable() {
    if (this.commentReportsTableReady) {
      return;
    }

    await db.runtime().execute(
      db.raw.sql`
        CREATE TABLE IF NOT EXISTS "CommentReport" (
          "commentId" integer NOT NULL,
          "userId" integer NOT NULL,
          "createdAt" timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY ("commentId", "userId"),
          FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE,
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
        )
      `
        .affectedCount()
        .build(),
    );

    this.commentReportsTableReady = true;
  }

  /* =========================================================
     MEMBER: CREATE COMMENT
  ========================================================= */

  async createComment(
    userId: number,
    data: {
      nuggetId: string;
      body: string;
    },
  ) {
    const body =
      data.body.trim();

    if (!body) {
      throw new BadRequestException(
        "Comment cannot be empty",
      );
    }

    const user =
      await db.orm.public.User
        .where({
          id: userId,
        })
        .first();

    if (!user) {
      throw new NotFoundException(
        "User not found",
      );
    }

    const nugget =
      await db.orm.public.Nugget
        .where({
          id: data.nuggetId,
        })
        .first();

    if (!nugget) {
      throw new NotFoundException(
        "Nugget not found",
      );
    }

    const created =
      await db.orm.public.Comment.create({
        nuggetId:
          nugget.id,

        userId:
          user.id,

        authorName:
          user.name,

        body,

        status:
          "pending",

        reportCount:
          0,

        adminReply:
          null,
      });

    if (!created) {
      throw new BadRequestException(
        "Could not submit comment",
      );
    }

    return created;
  }

  /* =========================================================
     PUBLIC: APPROVED COMMENTS FOR A NUGGET
  ========================================================= */

  async getApprovedForNugget(
    nuggetId: string,
  ) {
    const comments =
      await db.orm.public.Comment.all();

    return comments
      .filter(
        (comment) =>
          comment.nuggetId ===
            nuggetId &&
          comment.status ===
            "approved",
      )
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

  /* =========================================================
     MEMBER: REPORT COMMENT
  ========================================================= */

  async reportComment(
    id: number,
    userId: number,
  ) {
    const comment =
      await db.orm.public.Comment
        .where({
          id,
        })
        .first();

    if (!comment) {
      throw new NotFoundException(
        "Comment not found",
      );
    }

    const user =
      await db.orm.public.User
        .where({
          id: userId,
        })
        .first();

    if (!user) {
      throw new NotFoundException(
        "User not found",
      );
    }

    await this.ensureCommentReportsTable();

    const inserted =
      await db.runtime().query(
        db.raw.sql`
          INSERT INTO "CommentReport" (
            "commentId",
            "userId"
          )
          VALUES (
            ${id},
            ${userId}
          )
          ON CONFLICT (
            "commentId",
            "userId"
          )
          DO NOTHING
          RETURNING "commentId"
        `
          .returnsRow({
            commentId:
              "pg/int4@1",
          })
          .build(),
      );

    if (inserted.length === 0) {
      return {
        ...comment,
        alreadyReported: true,
        message:
          "You have already reported this comment",
      };
    }

    await db.runtime().execute(
      db.raw.sql`
        UPDATE "Comment"
        SET
          "reportCount" = "reportCount" + 1,
          "status" = 'flagged',
          "updatedAt" = now()
        WHERE "id" = ${id}
      `
        .affectedCount()
        .build(),
    );

    const updated =
      await db.orm.public.Comment
        .where({
          id,
        })
        .first();

    if (!updated) {
      throw new NotFoundException(
        "Comment not found",
      );
    }

    return {
      ...updated,
      alreadyReported: false,
    };
  }

  /* =========================================================
     ADMIN: GET MODERATION QUEUE
  ========================================================= */

  async getAdminComments() {
    const comments =
      await db.orm.public.Comment.all();

    const nuggets =
      await db.orm.public.Nugget.all();

    const rows =
      comments
        .map(
          (comment) => {
            const nugget =
              nuggets.find(
                (item) =>
                  item.id ===
                  comment.nuggetId,
              );

            return {
              ...comment,

              nugget: nugget
                ? {
                    id:
                      nugget.id,

                    title:
                      nugget.title,

                    slug:
                      nugget.slug,

                    number:
                      nugget.number,
                  }
                : null,
            };
          },
        )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt,
            ).getTime() -
          new Date(
            a.createdAt,
          ).getTime(),
      );

    const counts = {
      pending:
        rows.filter(
          (item) =>
            item.status ===
            "pending",
        ).length,

      approved:
        rows.filter(
          (item) =>
            item.status ===
            "approved",
        ).length,

      flagged:
        rows.filter(
          (item) =>
            item.status ===
            "flagged",
        ).length,

      rejected:
        rows.filter(
          (item) =>
            item.status ===
            "rejected",
        ).length,
    };

    return {
      comments: rows,
      counts,
    };
  }

  /* =========================================================
     ADMIN: UPDATE STATUS
  ========================================================= */

  async updateStatus(
    id: number,
    status: ModerationStatus,
  ) {
    const allowed: ModerationStatus[] =
      [
        "pending",
        "approved",
        "flagged",
        "rejected",
      ];

    if (
      !allowed.includes(
        status,
      )
    ) {
      throw new BadRequestException(
        "Invalid moderation status",
      );
    }

    const comment =
      await db.orm.public.Comment
        .where({
          id,
        })
        .first();

    if (!comment) {
      throw new NotFoundException(
        "Comment not found",
      );
    }

    const updated =
      await db.orm.public.Comment
        .where({
          id,
        })
        .update({
          status,
        });

    if (!updated) {
      throw new NotFoundException(
        "Comment not found",
      );
    }

    return updated;
  }

  /* =========================================================
     ADMIN: REPLY
  ========================================================= */

  async reply(
    id: number,
    reply: string,
  ) {
    const cleanReply =
      reply.trim();

    if (!cleanReply) {
      throw new BadRequestException(
        "Reply cannot be empty",
      );
    }

    const comment =
      await db.orm.public.Comment
        .where({
          id,
        })
        .first();

    if (!comment) {
      throw new NotFoundException(
        "Comment not found",
      );
    }

    const updated =
      await db.orm.public.Comment
        .where({
          id,
        })
        .update({
          adminReply:
            cleanReply,
        });

    if (!updated) {
      throw new NotFoundException(
        "Comment not found",
      );
    }

    return updated;
  }

  /* =========================================================
     ADMIN: BULK ACTION
  ========================================================= */

  async bulkAction(
    ids: number[],
    action:
      | "approve"
      | "reject"
      | "pending",
  ) {
    if (
      !Array.isArray(ids) ||
      ids.length === 0
    ) {
      throw new BadRequestException(
        "Select at least one comment",
      );
    }

    const status:
      ModerationStatus =
      action === "approve"
        ? "approved"
        : action ===
            "reject"
          ? "rejected"
          : "pending";

    const updatedIds:
      number[] = [];

    for (const id of ids) {
      const existing =
        await db.orm.public.Comment
          .where({
            id,
          })
          .first();

      if (!existing) {
        continue;
      }

      const updated =
        await db.orm.public.Comment
          .where({
            id,
          })
          .update({
            status,
          });

      if (updated) {
        updatedIds.push(
          id,
        );
      }
    }

    return {
      updated:
        updatedIds.length,

      ids:
        updatedIds,
    };
  }
}
