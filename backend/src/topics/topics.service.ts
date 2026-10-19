import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { db } from "../prisma/db";

type CreateTopicInput = {
  name: string;
  description?: string;
  visible?: boolean;
};

type UpdateTopicInput = {
  name?: string;
  description?: string;
  visible?: boolean;
  displayOrder?: number;
};

@Injectable()
export class TopicsService {
  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /* =========================================
     CREATE MISSING TOPICS FROM EXISTING NUGGETS
  ========================================= */

  private async syncFromNuggets() {
    const nuggets =
      await db.orm.public.Nugget.all();

    const existingTopics =
      await db.orm.public.Topic.all();

    const existingNames =
      new Set(
        existingTopics.map(
          (topic) =>
            topic.name
              .trim()
              .toLowerCase(),
        ),
      );

    const nuggetTopics = [
      ...new Set(
        nuggets
          .map((nugget) =>
            nugget.topic?.trim(),
          )
          .filter(
            (topic): topic is string =>
              Boolean(topic),
          ),
      ),
    ];

    let nextOrder =
      existingTopics.length;

    for (const name of nuggetTopics) {
      if (
        existingNames.has(
          name.toLowerCase(),
        )
      ) {
        continue;
      }

      await db.orm.public.Topic.create({
        name,
        slug: this.slugify(name),
        description: null,
        visible: true,
        displayOrder: nextOrder,
      });

      existingNames.add(
        name.toLowerCase(),
      );

      nextOrder += 1;
    }
  }

  /* =========================================
     ALL TOPICS + REAL NUGGET COUNTS
  ========================================= */

  async getAllTopics() {
    await this.syncFromNuggets();

    const topics =
      await db.orm.public.Topic.all();

    const nuggets =
      await db.orm.public.Nugget.all();

    return topics
      .map((topic) => ({
        ...topic,

        nuggetCount:
          nuggets.filter(
            (nugget) =>
              nugget.topic ===
              topic.name,
          ).length,
      }))
      .sort(
        (a, b) =>
          a.displayOrder -
          b.displayOrder,
      );
  }

  /* =========================================
     CREATE
  ========================================= */

  async createTopic(
    input: CreateTopicInput,
  ) {
    const name =
      input.name.trim();

    if (!name) {
      throw new ConflictException(
        "Topic name is required",
      );
    }

    const existing =
      await db.orm.public.Topic
        .where({ name })
        .first();

    if (existing) {
      throw new ConflictException(
        "Topic already exists",
      );
    }

    const topics =
      await db.orm.public.Topic.all();

    return db.orm.public.Topic.create({
      name,
      slug: this.slugify(name),

      description:
        input.description?.trim() ||
        null,

      visible:
        input.visible ?? true,

      displayOrder:
        topics.length,
    });
  }

  /* =========================================
     UPDATE
  ========================================= */

  async updateTopic(
    id: number,
    input: UpdateTopicInput,
  ) {
    const existing =
      await db.orm.public.Topic
        .where({ id })
        .first();

    if (!existing) {
      throw new NotFoundException(
        "Topic not found",
      );
    }

    const oldName =
      existing.name;

    const updates: any = {};

    if (
      input.name !== undefined
    ) {
      const name =
        input.name.trim();

      if (!name) {
        throw new ConflictException(
          "Topic name is required",
        );
      }

      updates.name = name;
      updates.slug =
        this.slugify(name);
    }

    if (
      input.description !==
      undefined
    ) {
      updates.description =
        input.description.trim() ||
        null;
    }

    if (
      input.visible !==
      undefined
    ) {
      updates.visible =
        input.visible;
    }

    if (
      input.displayOrder !==
      undefined
    ) {
      updates.displayOrder =
        input.displayOrder;
    }

    const updated =
      await db.orm.public.Topic
        .where({ id })
        .update(updates);

    /*
     * If an admin renames a topic,
     * update existing Nuggets using
     * that old topic name too.
     */

    if (
      input.name &&
      input.name.trim() !==
        oldName
    ) {
      const nuggets =
        await db.orm.public.Nugget
          .where({
            topic: oldName,
          })
          .all();

      for (const nugget of nuggets) {
        await db.orm.public.Nugget
          .where({
            id: nugget.id,
          })
          .update({
            topic:
              input.name.trim(),
          });
      }
    }

    return updated;
  }

  /* =========================================
     REORDER
  ========================================= */

  async reorderTopics(
    ids: number[],
  ) {
    for (
      let index = 0;
      index < ids.length;
      index += 1
    ) {
      await db.orm.public.Topic
        .where({
          id: ids[index],
        })
        .update({
          displayOrder: index,
        });
    }

    return this.getAllTopics();
  }
}