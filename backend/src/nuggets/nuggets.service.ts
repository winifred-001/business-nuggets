import { Injectable, NotFoundException } from "@nestjs/common";
import { db } from "../prisma/db";
import { CreateNuggetDto } from "./dto/create-nugget.dto";
import { UpdateNuggetDto } from "../nuggets/dto/update-nugget.dto";

@Injectable()
export class NuggetsService {
  async getPublishedNuggets() {
    return db.orm.public.Nugget
      .where({ status: "published" })
      .all();
  }

  async getNuggetBySlug(slug: string) {
    const nugget = await db.orm.public.Nugget
      .where({
        slug,
        status: "published",
      })
      .first();

    if (!nugget) {
      throw new NotFoundException("Nugget not found");
    }

    return nugget;
  }

  async getAllNuggetsForAdmin() {
    return db.orm.public.Nugget.all();
  }

  async createNugget(dto: CreateNuggetDto) {
  const status = dto.status ?? "draft";

  return db.orm.public.Nugget.create({
    id: `nugget-${dto.number}`,
    number: dto.number,
    slug: dto.slug,
    title: dto.title,
    topic: dto.topic,
    tag: dto.tag,
    scriptureRef: dto.scriptureRef,
    scriptureText: dto.scriptureText,
    image: dto.image,
    keyPrinciple: dto.keyPrinciple,
    marketplaceApplication: dto.marketplaceApplication,
    practicalActionPlan: dto.practicalActionPlan,
    duration: dto.duration,
    isGold: dto.isGold ?? false,
    book: dto.book,
    bibleSection: dto.bibleSection,
    challenges: dto.challenges,
    status,
    featured: dto.featured ?? false,
    audioUrl: dto.audioUrl ?? null,
    publishedAt:
      status === "published"
        ? dto.publishedAt ?? new Date().toISOString()
        : null,
  });
}

async updateNugget(id: string, dto: UpdateNuggetDto) {
  const existing = await db.orm.public.Nugget
    .where({ id })
    .first();

  if (!existing) {
    throw new NotFoundException("Nugget not found");
  }

  const updates: any = {
    ...dto,
  };

  if (dto.status === "published" && existing.status !== "published") {
    updates.publishedAt = new Date().toISOString();
  }

  if (dto.status === "draft") {
    updates.publishedAt = null;
  }

  return db.orm.public.Nugget
    .where({ id })
    .update(updates);
}

async deleteNugget(id: string) {
  const existing = await db.orm.public.Nugget
    .where({ id })
    .first();

  if (!existing) {
    throw new NotFoundException("Nugget not found");
  }

  return db.orm.public.Nugget
    .where({ id })
    .delete();
}

}
