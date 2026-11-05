import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { db } from "../prisma/db";

@Injectable()
export class SavedFoldersService {
  async createFolder(
    userId: number,
    name: string,
    description?: string,
    nuggetIds: string[] = [],
  ) {
    const trimmedName =
      name?.trim();

    if (!trimmedName) {
      throw new BadRequestException(
        "Folder name is required",
      );
    }

    const folder =
      await db.orm.public.SavedFolder.create({
        userId,
        name: trimmedName,
        description:
          description?.trim() || null,
      });

    if (
      nuggetIds.length >
      0
    ) {
      const saved =
        await db.orm.public.SavedNugget
          .where({
            userId,
          })
          .all();

      const savedIds =
        new Set(
          saved.map(
            (item) =>
              item.nuggetId,
          ),
        );

      const uniqueIds =
        [
          ...new Set(
            nuggetIds,
          ),
        ].filter(
          (nuggetId) =>
            savedIds.has(
              nuggetId,
            ),
        );

      for (
        const nuggetId
        of uniqueIds
      ) {
        await db.orm.public.SavedFolderItem.create({
          folderId:
            folder.id,
          nuggetId,
        });
      }
    }

    const items =
      await db.orm.public.SavedFolderItem
        .where({
          folderId:
            folder.id,
        })
        .all();

    return {
      ...folder,
      items,
    };
  }

  async getFolders(
    userId: number,
  ) {
    const folders =
      await db.orm.public.SavedFolder
        .where({
          userId,
        })
        .all();

    return Promise.all(
      folders.map(
        async (
          folder,
        ) => {
          const items =
            await db.orm.public.SavedFolderItem
              .where({
                folderId:
                  folder.id,
              })
              .all();

          return {
            ...folder,
            items,
          };
        },
      ),
    );
  }

  async addItem(
    userId: number,
    folderId: number,
    nuggetId: string,
  ) {
    const folder =
      await db.orm.public.SavedFolder
        .where({
          id: folderId,
          userId,
        })
        .first();

    if (!folder) {
      throw new NotFoundException(
        "Folder not found",
      );
    }

    const saved =
      await db.orm.public.SavedNugget
        .where({
          userId,
          nuggetId,
        })
        .first();

    if (!saved) {
      throw new BadRequestException(
        "Save this Nugget before adding it to a folder",
      );
    }

    const existing =
      await db.orm.public.SavedFolderItem
        .where({
          folderId,
          nuggetId,
        })
        .first();

    if (existing) {
      return {
        message:
          "Nugget is already in this folder",
        item: existing,
      };
    }

    const item =
      await db.orm.public.SavedFolderItem.create({
        folderId,
        nuggetId,
      });

    return {
      message:
        "Nugget added to folder",
      item,
    };
  }

  async removeItem(
    userId: number,
    folderId: number,
    nuggetId: string,
  ) {
    const folder =
      await db.orm.public.SavedFolder
        .where({
          id: folderId,
          userId,
        })
        .first();

    if (!folder) {
      throw new NotFoundException(
        "Folder not found",
      );
    }

    return db.orm.public.SavedFolderItem
      .where({
        folderId,
        nuggetId,
      })
      .delete();
  }

  async deleteFolder(
    userId: number,
    folderId: number,
  ) {
    const folder =
      await db.orm.public.SavedFolder
        .where({
          id: folderId,
          userId,
        })
        .first();

    if (!folder) {
      throw new NotFoundException(
        "Folder not found",
      );
    }

    return db.orm.public.SavedFolder
      .where({
        id: folderId,
        userId,
      })
      .delete();
  }
}