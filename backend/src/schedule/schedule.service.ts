import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";

import {
  Cron,
  CronExpression,
} from "@nestjs/schedule";

import { db } from "../prisma/db";

type CreateScheduleInput = {
  nuggetId: string;
  scheduledFor: string;
};

@Injectable()
export class ScheduleService
  implements OnModuleInit
{
  private readonly logger =
    new Logger(
      ScheduleService.name,
    );

  private processing = false;

  /* =========================================
     START SCHEDULE CHECKER
  ========================================= */

  onModuleInit() {
    void this.processDueSchedules();
  }

  @Cron(
    CronExpression.EVERY_MINUTE,
  )
  async handleScheduledNuggets() {
    await this.processDueSchedules();
  }

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
                id:
                  nugget.id,

                slug:
                  nugget.slug,

                number:
                  nugget.number,

                title:
                  nugget.title,

                topic:
                  nugget.topic,

                scriptureRef:
                  nugget.scriptureRef,

                status:
                  nugget.status,

                image:
                  nugget.image,
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
          id:
            input.nuggetId,
        })
        .first();

    if (!nugget) {
      throw new NotFoundException(
        "Nugget not found",
      );
    }

    if (
      nugget.status ===
      "published"
    ) {
      throw new ConflictException(
        "Published nuggets cannot be scheduled",
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

    const existingTime =
      await db.orm.public.NuggetSchedule
        .where({
          scheduledFor:
            input.scheduledFor,
        })
        .first();

    if (existingTime) {
      throw new ConflictException(
        "Another Nugget is already scheduled for that exact time",
      );
    }

    const existingNugget =
      await db.orm.public.NuggetSchedule
        .where({
          nuggetId:
            input.nuggetId,
        })
        .first();

    if (existingNugget) {
      throw new ConflictException(
        "This Nugget is already scheduled",
      );
    }

    return db.orm.public.NuggetSchedule.create({
      nuggetId:
        input.nuggetId,

      scheduledFor:
        scheduledDate.toISOString(),
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
        .where({
          id,
        })
        .first();

    if (!existing) {
      throw new NotFoundException(
        "Scheduled item not found",
      );
    }

    const nugget =
      await db.orm.public.Nugget
        .where({
          id:
            input.nuggetId,
        })
        .first();

    if (!nugget) {
      throw new NotFoundException(
        "Nugget not found",
      );
    }

    if (
      nugget.status ===
      "published"
    ) {
      throw new ConflictException(
        "Published nuggets cannot be scheduled",
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

    const schedules =
      await db.orm.public.NuggetSchedule.all();

    const conflictingTime =
      schedules.find(
        (schedule) =>
          schedule.id !== id &&
          schedule.scheduledFor ===
            input.scheduledFor,
      );

    if (conflictingTime) {
      throw new ConflictException(
        "Another Nugget is already scheduled for that exact time",
      );
    }

    const conflictingNugget =
      schedules.find(
        (schedule) =>
          schedule.id !== id &&
          schedule.nuggetId ===
            input.nuggetId,
      );

    if (conflictingNugget) {
      throw new ConflictException(
        "This Nugget is already scheduled",
      );
    }

    return db.orm.public.NuggetSchedule
      .where({ id })
      .update({
        nuggetId:
          input.nuggetId,

        scheduledFor:
          scheduledDate.toISOString(),
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
          nugget.status !==
            "published" &&
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

      const nugget =
        available[
          nuggetIndex
        ];

      await db.orm.public.NuggetSchedule.create({
        nuggetId:
          nugget.id,

        scheduledFor:
          date.toISOString(),
      });

      nuggetIndex += 1;
    }

    return this.getSchedule();
  }

  /* =========================================
     PROCESS DUE SCHEDULES
  ========================================= */

  async processDueSchedules() {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      const schedules =
        await db.orm.public.NuggetSchedule.all();

      const now =
        Date.now();

      const dueSchedules =
        schedules.filter(
          (schedule) => {
            const scheduledTime =
              new Date(
                schedule.scheduledFor,
              ).getTime();

            if (
              Number.isNaN(
                scheduledTime,
              )
            ) {
              return false;
            }

            return (
              scheduledTime <=
              now
            );
          },
        );

      for (
        const schedule
        of dueSchedules
      ) {
        try {
          const nugget =
            await db.orm.public.Nugget
              .where({
                id:
                  schedule.nuggetId,
              })
              .first();

          if (!nugget) {
            this.logger.warn(
              `Scheduled Nugget ${schedule.nuggetId} no longer exists`,
            );

            await db.orm.public.NuggetSchedule
              .where({
                id:
                  schedule.id,
              })
              .delete();

            continue;
          }

          if (
            nugget.status !==
            "published"
          ) {
            await db.orm.public.Nugget
              .where({
                id:
                  nugget.id,
              })
              .update({
                status:
                  "published",

                publishedAt:
                  new Date().toISOString(),
              });

            this.logger.log(
              `Published scheduled Nugget ${nugget.id}`,
            );
          }

          await db.orm.public.NuggetSchedule
            .where({
              id:
                schedule.id,
            })
            .delete();
        } catch (error) {
          this.logger.error(
            `Could not publish scheduled Nugget ${schedule.nuggetId}`,
            error instanceof Error
              ? error.stack
              : undefined,
          );
        }
      }
    } finally {
      this.processing = false;
    }
  }
}
