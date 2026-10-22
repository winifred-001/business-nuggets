import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { db } from "../prisma/db";

import {
  CreateNuggetDto,
} from "./dto/create-nugget.dto";

import {
  UpdateNuggetDto,
} from "./dto/update-nugget.dto";

@Injectable()
export class NuggetsService {
  /* =========================================================
     GET PUBLISHED NUGGETS
     SEARCH + FILTER + SORT + PAGINATION
  ========================================================= */

  async getPublishedNuggets(
    query?: {
      search?: string;
      topic?: string;
      book?: string;
      bibleSection?: string;
      gold?: string;
      featured?: string;
      sort?: string;
      page?: string;
      limit?: string;
    },
  ) {
    let nuggets =
      await db.orm.public.Nugget
        .where({
          status: "published",
        })
        .all();

    /* =========================================================
       SEARCH
    ========================================================= */

    const search =
      query?.search
        ?.trim()
        .toLowerCase();

    if (search) {
      nuggets =
        nuggets.filter(
          (nugget) =>
            nugget.title
              .toLowerCase()
              .includes(search) ||
            nugget.topic
              .toLowerCase()
              .includes(search) ||
            nugget.tag
              .toLowerCase()
              .includes(search) ||
            nugget.scriptureRef
              .toLowerCase()
              .includes(search) ||
            nugget.scriptureText
              .toLowerCase()
              .includes(search) ||
            nugget.keyPrinciple
              .toLowerCase()
              .includes(search) ||
            nugget.marketplaceApplication
              .toLowerCase()
              .includes(search),
        );
    }

    /* =========================================================
       TOPIC FILTER
    ========================================================= */

    if (query?.topic) {
      const topic =
        query.topic
          .trim()
          .toLowerCase();

      nuggets =
        nuggets.filter(
          (nugget) =>
            nugget.topic
              .toLowerCase() ===
            topic,
        );
    }

    /* =========================================================
       BOOK FILTER
    ========================================================= */

    if (query?.book) {
      const book =
        query.book
          .trim()
          .toLowerCase();

      nuggets =
        nuggets.filter(
          (nugget) =>
            nugget.book
              .toLowerCase() ===
            book,
        );
    }

    /* =========================================================
       BIBLE SECTION FILTER
    ========================================================= */

    if (query?.bibleSection) {
      const bibleSection =
        query.bibleSection
          .trim()
          .toLowerCase();

      nuggets =
        nuggets.filter(
          (nugget) =>
            nugget.bibleSection
              .toLowerCase() ===
            bibleSection,
        );
    }

    /* =========================================================
       GOLD FILTER
    ========================================================= */

    if (
      query?.gold ===
      "true"
    ) {
      nuggets =
        nuggets.filter(
          (nugget) =>
            nugget.isGold,
        );
    }

    if (
      query?.gold ===
      "false"
    ) {
      nuggets =
        nuggets.filter(
          (nugget) =>
            !nugget.isGold,
        );
    }

    /* =========================================================
       FEATURED FILTER
    ========================================================= */

    if (
      query?.featured ===
      "true"
    ) {
      nuggets =
        nuggets.filter(
          (nugget) =>
            nugget.featured,
        );
    }

    if (
      query?.featured ===
      "false"
    ) {
      nuggets =
        nuggets.filter(
          (nugget) =>
            !nugget.featured,
        );
    }

    /* =========================================================
       SORTING
    ========================================================= */

    switch (query?.sort) {
      case "oldest":
        nuggets.sort(
          (a, b) =>
            a.number -
            b.number,
        );
        break;

      case "newest":
        nuggets.sort(
          (a, b) =>
            b.number -
            a.number,
        );
        break;

      case "title-asc":
        nuggets.sort(
          (a, b) =>
            a.title.localeCompare(
              b.title,
            ),
        );
        break;

      case "title-desc":
        nuggets.sort(
          (a, b) =>
            b.title.localeCompare(
              a.title,
            ),
        );
        break;

      default:
        nuggets.sort(
          (a, b) =>
            a.number -
            b.number,
        );
    }

    /* =========================================================
       PAGINATION
    ========================================================= */

    const page =
      Math.max(
        Number.parseInt(
          query?.page ??
            "1",
          10,
        ) || 1,
        1,
      );

    const limit =
      Math.min(
        Math.max(
          Number.parseInt(
            query?.limit ??
              "12",
            10,
          ) || 12,
          1,
        ),
        100,
      );

    const total =
      nuggets.length;

    const totalPages =
      Math.max(
        Math.ceil(
          total /
            limit,
        ),
        1,
      );

    const start =
      (page - 1) *
      limit;

    const data =
      nuggets.slice(
        start,
        start +
          limit,
      );

    return {
      data,

      pagination: {
        page,
        limit,
        total,
        totalPages,

        hasNextPage:
          page <
          totalPages,

        hasPreviousPage:
          page > 1,
      },
    };
  }

  /* =========================================================
     GET ONE PUBLISHED NUGGET
  ========================================================= */

  async getNuggetBySlug(
    slug: string,
  ) {
    const nugget =
      await db.orm.public.Nugget
        .where({
          slug,
          status:
            "published",
        })
        .first();

    if (!nugget) {
      throw new NotFoundException(
        "Nugget not found",
      );
    }

    return nugget;
  }

  /* =========================================================
     ADMIN - GET ALL NUGGETS
  ========================================================= */

  async getAllNuggetsForAdmin() {
    return db.orm.public.Nugget.all();
  }

  /* =========================================================
     ADMIN - CREATE NUGGET
  ========================================================= */

  async createNugget(
    dto: CreateNuggetDto,
  ) {
    const status =
      dto.status ??
      "draft";

    return db.orm.public.Nugget.create({
      id:
        `nugget-${dto.number}`,

      number:
        dto.number,

      slug:
        dto.slug,

      title:
        dto.title,

      topic:
        dto.topic,

      tag:
        dto.tag,

      scriptureRef:
        dto.scriptureRef,

      scriptureText:
        dto.scriptureText,

      image:
        dto.image,

      keyPrinciple:
        dto.keyPrinciple,

      marketplaceApplication:
        dto.marketplaceApplication,

      practicalActionPlan:
        dto.practicalActionPlan,

      duration:
        dto.duration,

      isGold:
        dto.isGold ??
        false,

      book:
        dto.book,

      bibleSection:
        dto.bibleSection,

      challenges:
        dto.challenges,

      status,

      featured:
        dto.featured ??
        false,

      audioUrl:
        dto.audioUrl ??
        null,

      publishedAt:
        status ===
        "published"
          ? dto.publishedAt ??
            new Date()
              .toISOString()
          : null,
    });
  }

  /* =========================================================
     ADMIN - UPDATE NUGGET
  ========================================================= */

  async updateNugget(
    id: string,
    dto: UpdateNuggetDto,
  ) {
    const existing =
      await db.orm.public.Nugget
        .where({
          id,
        })
        .first();

    if (!existing) {
      throw new NotFoundException(
        "Nugget not found",
      );
    }

    const updates: any = {
      ...dto,
    };

    if (
      dto.status ===
        "published" &&
      existing.status !==
        "published"
    ) {
      updates.publishedAt =
        new Date()
          .toISOString();
    }

    if (
      dto.status ===
      "draft"
    ) {
      updates.publishedAt =
        null;
    }

    return db.orm.public.Nugget
      .where({
        id,
      })
      .update(
        updates,
      );
  }

  /* =========================================================
     ADMIN - DELETE NUGGET
  ========================================================= */

  async deleteNugget(
    id: string,
  ) {
    const existing =
      await db.orm.public.Nugget
        .where({
          id,
        })
        .first();

    if (!existing) {
      throw new NotFoundException(
        "Nugget not found",
      );
    }

    return db.orm.public.Nugget
      .where({
        id,
      })
      .delete();
  }
}