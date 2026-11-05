import { Injectable } from "@nestjs/common";
import { db } from "../prisma/db";

@Injectable()
export class SavedNuggetsService {
  async saveNugget(userId: number, nuggetId: string) {
    return db.orm.public.SavedNugget.create({
      userId,
      nuggetId,
    });
  }

  async getSavedNuggets(userId: number) {
    return db.orm.public.SavedNugget
      .where({ userId })
      .all();
  }

  async removeSavedNugget(userId: number, nuggetId: string) {
  return db.orm.public.SavedNugget
    .where({
      userId,
      nuggetId,
    })
    .delete();
}
}