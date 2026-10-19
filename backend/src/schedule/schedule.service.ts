import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { db } from "../prisma/db";

type CreateScheduleInput = {
  nuggetId: string;
  scheduledFor: string;
};

@Injectable()
export class ScheduleService {
  /* =========================================
     GET ALL
  ========================================= */

  async getSchedule() {
    const schedules =
      await db.orm.public.NuggetSchedule.all();

    const nuggets =
      await db.orm.public.Nugget.all();

    return schedules
      .map((schedule) => {
        const nugget =
          nuggets.find(
            (item) =>
              item.id ===
              schedule.nuggetId,
          );

        return {
          ...schedule,

          nugget: nugget
            ? {
                id: nugget.id,
                slug: nugget.slug,
                number: nugget.number,
                title: nugget.title,
                topic: nugget.topic,
                scriptureRef:
                  nugget.scriptureRef,
                status: nugget.status,
                image: nugget.image,
              }
            : null,
        };
      })
      .sort(
        (a, b) =>
          new Date(
            a.scheduledFor,
          ).getTime() -
          new Date(
            b.scheduledFor,
          ).getTime(),
      );
  }

  /* =========================================
     CREATE
  ========================================= */

  async createSchedule(
    input: CreateScheduleInput,
  ) {
    const nugget =
      await db.orm.public.Nugget
        .where({
          id: input.nuggetId,
        })
        .first();

    if (!nugget) {
      throw new NotFoundException(
        "Nugget not found",
      );
    }

    const scheduledDate =
      new Date(
        input.scheduledFor,
      );

    if (
      Number.isNaN(
        scheduledDate.getTime(),
      )
    ) {
      throw new ConflictException(
        "Invalid schedule date",
      );
    }

    const existing =
      await db.orm.public.NuggetSchedule
        .where({
          scheduledFor:
            input.scheduledFor,
        })
        .first();

    if (existing) {
      throw new ConflictException(
        "Another Nugget is already scheduled for that exact time",
      );
    }

    return db.orm.public.NuggetSchedule.create({
      nuggetId:
        input.nuggetId,

      scheduledFor:
        input.scheduledFor,
    });
  }

  /* =========================================
     UPDATE
  ========================================= */

  async updateSchedule(
    id: number,
    input: CreateScheduleInput,
  ) {
    const existing =
      await db.orm.public.NuggetSchedule
        .where({ id })
        .first();

    if (!existing) {
      throw new NotFoundException(
        "Scheduled item not found",
      );
    }

    const nugget =
      await db.orm.public.Nugget
        .where({
          id: input.nuggetId,
        })
        .first();

    if (!nugget) {
      throw new NotFoundException(
        "Nugget not found",
      );
    }

    return db.orm.public.NuggetSchedule
      .where({ id })
      .update({
        nuggetId:
          input.nuggetId,

        scheduledFor:
          input.scheduledFor,
      });
  }

  /* =========================================
     DELETE
  ========================================= */

  async deleteSchedule(
    id: number,
  ) {
    const existing =
      await db.orm.public.NuggetSchedule
        .where({ id })
        .first();

    if (!existing) {
      throw new NotFoundException(
        "Scheduled item not found",
      );
    }

    return db.orm.public.NuggetSchedule
      .where({ id })
      .delete();
  }

  /* =========================================
     AUTO FILL NEXT 7 DAYS
  ========================================= */

  async autoFillWeek() {
    const nuggets =
      await db.orm.public.Nugget.all();

    const schedules =
      await db.orm.public.NuggetSchedule.all();

    const scheduledIds =
      new Set(
        schedules.map(
          (item) =>
            item.nuggetId,
        ),
      );

    const available =
      nuggets.filter(
        (nugget) =>
          !scheduledIds.has(
            nugget.id,
          ),
      );

    let nuggetIndex = 0;

    const now =
      new Date();

    for (
      let dayOffset = 1;
      dayOffset <= 7;
      dayOffset += 1
    ) {
      if (
        nuggetIndex >=
        available.length
      ) {
        break;
      }

      const date =
        new Date(now);

      date.setDate(
        now.getDate() +
          dayOffset,
      );

      date.setHours(
        6,
        0,
        0,
        0,
      );

      const dateString =
        date.toISOString();

      const dayAlreadyUsed =
        schedules.some(
          (schedule) => {
            const scheduled =
              new Date(
                schedule.scheduledFor,
              );

            return (
              scheduled.getFullYear() ===
                date.getFullYear() &&
              scheduled.getMonth() ===
                date.getMonth() &&
              scheduled.getDate() ===
                date.getDate()
            );
          },
        );

      if (dayAlreadyUsed) {
        continue;
      }

      await db.orm.public.NuggetSchedule.create({
        nuggetId:
          available[
            nuggetIndex
          ].id,

        scheduledFor:
          dateString,
      });

      nuggetIndex += 1;
    }

    return this.getSchedule();
  }
}