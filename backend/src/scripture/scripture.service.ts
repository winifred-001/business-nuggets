import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { db } from "../prisma/db";

type CreateBookInput = {
  name: string;
  chapterCount?: number;
};

type UpdateBookInput = {
  name?: string;
  chapterCount?: number;
  visible?: boolean;
  displayOrder?: number;
};

@Injectable()
export class ScriptureService {
  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /* =========================================
     SYNC BOOKS ALREADY USED BY NUGGETS
  ========================================= */

  private async syncBooksFromNuggets() {
    const nuggets =
      await db.orm.public.Nugget.all();

    const books =
      await db.orm.public.ScriptureBook.all();

    const existingNames =
      new Set(
        books.map((book) =>
          book.name
            .trim()
            .toLowerCase(),
        ),
      );

    const nuggetBooks = [
      ...new Set(
        nuggets
          .map((nugget) =>
            nugget.book?.trim(),
          )
          .filter(
            (book): book is string =>
              Boolean(book),
          ),
      ),
    ];

    let nextOrder =
      books.length;

    for (const name of nuggetBooks) {
      if (
        existingNames.has(
          name.toLowerCase(),
        )
      ) {
        continue;
      }

      await db.orm.public.ScriptureBook.create({
        name,

        slug:
          this.slugify(name),

        chapterCount: 0,

        visible: true,

        displayOrder:
          nextOrder,
      });

      existingNames.add(
        name.toLowerCase(),
      );

      nextOrder += 1;
    }
  }

  /* =========================================
     INDEX
  ========================================= */

  async getIndex() {
    await this.syncBooksFromNuggets();

    const books =
      await db.orm.public.ScriptureBook.all();

    const nuggets =
      await db.orm.public.Nugget.all();

    const indexedBooks =
      books
        .map((book) => {
          const bookNuggets =
            nuggets.filter(
              (nugget) =>
                nugget.book ===
                book.name,
            );

          return {
            ...book,

            nuggetCount:
              bookNuggets.length,
          };
        })
        .sort(
          (a, b) =>
            a.displayOrder -
            b.displayOrder,
        );

    const unlinkedNuggets =
      nuggets.filter(
        (nugget) =>
          !nugget.book?.trim() ||
          !nugget.scriptureRef?.trim(),
      );

    return {
      books: indexedBooks,

      unlinkedCount:
        unlinkedNuggets.length,

      unlinkedNuggets:
        unlinkedNuggets.map(
          (nugget) => ({
            id: nugget.id,
            title:
              nugget.title,
            number:
              nugget.number,
          }),
        ),
    };
  }

  /* =========================================
     CREATE BOOK
  ========================================= */

  async createBook(
    input: CreateBookInput,
  ) {
    const name =
      input.name.trim();

    if (!name) {
      throw new ConflictException(
        "Book name is required",
      );
    }

    const existing =
      await db.orm.public.ScriptureBook
        .where({ name })
        .first();

    if (existing) {
      throw new ConflictException(
        "Book already exists",
      );
    }

    const books =
      await db.orm.public.ScriptureBook.all();

    return db.orm.public.ScriptureBook.create({
      name,

      slug:
        this.slugify(name),

      chapterCount:
        Math.max(
          0,
          input.chapterCount ??
            0,
        ),

      visible: true,

      displayOrder:
        books.length,
    });
  }

  /* =========================================
     UPDATE BOOK
  ========================================= */

  async updateBook(
    id: number,
    input: UpdateBookInput,
  ) {
    const existing =
      await db.orm.public.ScriptureBook
        .where({ id })
        .first();

    if (!existing) {
      throw new NotFoundException(
        "Scripture book not found",
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
          "Book name is required",
        );
      }

      updates.name = name;

      updates.slug =
        this.slugify(name);
    }

    if (
      input.chapterCount !==
      undefined
    ) {
      updates.chapterCount =
        Math.max(
          0,
          input.chapterCount,
        );
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
      await db.orm.public.ScriptureBook
        .where({ id })
        .update(updates);

    /*
     * Keep existing Nuggets connected
     * if the admin renames the book.
     */

    if (
      input.name &&
      input.name.trim() !==
        oldName
    ) {
      const nuggets =
        await db.orm.public.Nugget
          .where({
            book: oldName,
          })
          .all();

      for (const nugget of nuggets) {
        await db.orm.public.Nugget
          .where({
            id: nugget.id,
          })
          .update({
            book:
              input.name.trim(),
          });
      }
    }

    return updated;
  }
}