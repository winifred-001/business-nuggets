import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { db } from "../prisma/db";

@Injectable()
export class FollowingService {
  async followTopic(userId: number, topic: string) {
    const existing = await db.orm.public.FollowedTopic
      .where({
        userId,
        topic,
      })
      .first();

    if (existing) {
      return {
        message: "Topic already followed",
        followedTopic: existing,
      };
    }

    const followedTopic =
      await db.orm.public.FollowedTopic.create({
        userId,
        topic,
      });

    return {
      message: "Topic followed",
      followedTopic,
    };
  }

  async getFollowedTopics(userId: number) {
    return db.orm.public.FollowedTopic
      .where({ userId })
      .all();
  }

  async unfollowTopic(
    userId: number,
    topic: string
  ) {
    const existing = await db.orm.public.FollowedTopic
      .where({
        userId,
        topic,
      })
      .first();

    if (!existing) {
      throw new NotFoundException(
        "Followed topic not found"
      );
    }

    await db.orm.public.FollowedTopic
      .where({
        userId,
        topic,
      })
      .delete();

    return {
      message: "Topic unfollowed",
    };
  }
}