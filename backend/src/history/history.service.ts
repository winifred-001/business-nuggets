import { Injectable } from "@nestjs/common";
import { db } from "../prisma/db";

@Injectable()
export class HistoryService {
  async getHistory(userId: number) {
    return db.orm.public.History
      .where({ userId })
      .all();
  }

  async updateHistory(
    userId: number,
    nuggetId: string,
    progress = 0
  ) {
    const existing = await db.orm.public.History
      .where({
        userId,
        nuggetId,
      })
      .first();

    if (existing) {
      return db.orm.public.History
        .where({
          userId,
          nuggetId,
        })
        .update({
          progress,
          lastOpenedAt: new Date().toISOString(),
        });
    }

    return db.orm.public.History.create({
      userId,
      nuggetId,
      progress,
      lastOpenedAt: new Date().toISOString(),
    });
  }

  async removeHistory(
    userId: number,
    nuggetId: string
  ) {
    return db.orm.public.History
      .where({
        userId,
        nuggetId,
      })
      .delete();
  }
}