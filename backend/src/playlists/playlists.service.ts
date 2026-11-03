import { randomBytes } from "node:crypto";
import type { PlaylistNameDto } from "./dto/playlist.dto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { db } from "../prisma/db";

@Injectable()
export class PlaylistsService {
  private metadataReady?: Promise<void>;

  private ensureMetadata() {
    this.metadataReady ??= db.runtime().execute(db.raw.sql`
      ALTER TABLE "Playlist"
        ADD COLUMN IF NOT EXISTS "description" text NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "shareToken" text UNIQUE
    `.affectedCount().build()).then(() => undefined).catch(error => {
      this.metadataReady = undefined;
      throw error;
    });
    return this.metadataReady;
  }

  async createPlaylist(userId: number, data: PlaylistNameDto) {
    await this.ensureMetadata();
    const token = data.privacy === "shared" ? randomBytes(32).toString("hex") : "";
    const [playlist] = await db.runtime().query(db.raw.sql`
      INSERT INTO "Playlist" ("userId", "name", "description", "shareToken")
      VALUES (${userId}, ${data.name.trim()}, ${data.description?.trim() ?? ""}, NULLIF(${token}, ''))
      RETURNING "id", "name", "description", COALESCE("shareToken", '') AS "shareToken"
    `.returnsRow({ id: "pg/int4@1", name: "pg/text@1", description: "pg/text@1", shareToken: "pg/text@1" }).build());
    return playlist;
  }

  async getPlaylists(userId: number) {
    await this.ensureMetadata();
    const playlists = await db.runtime().query(db.raw.sql`
      SELECT "id", "name", "userId", "createdAt", "description", COALESCE("shareToken", '') AS "shareToken"
      FROM "Playlist" WHERE "userId" = ${userId}
    `.returnsRow({
      id: "pg/int4@1", name: "pg/text@1", userId: "pg/int4@1",
      createdAt: "pg/timestamptz-string@1", description: "pg/text@1",
      shareToken: "pg/text@1",
    }).build());
    return Promise.all(playlists.map(async playlist => ({
      ...playlist,
      items: await db.orm.public.PlaylistItem.where({ playlistId: playlist.id }).all(),
    })));
  }

  async getSharedPlaylist(token: string) {
    if (!/^[a-f0-9]{64}$/.test(token)) throw new NotFoundException("Playlist not found");
    await this.ensureMetadata();
    const rows = await db.runtime().query(db.raw.sql`
      SELECT p."name", p."description", COALESCE(i."nuggetId", '') AS "nuggetId"
      FROM "Playlist" p LEFT JOIN "PlaylistItem" i ON i."playlistId" = p."id"
      WHERE p."shareToken" = ${token} ORDER BY i."id"
    `.returnsRow({
      name: "pg/text@1", description: "pg/text@1",
      nuggetId: "pg/text@1",
    }).build());
    if (!rows.length) throw new NotFoundException("Playlist not found");
    return {
      name: rows[0].name,
      description: rows[0].description,
      nuggetIds: rows.flatMap(row => row.nuggetId ? [row.nuggetId] : []),
    };
  }

  async addItem(
    userId: number,
    playlistId: number,
    nuggetId: string
  ) {
    const playlist = await db.orm.public.Playlist
      .where({
        id: playlistId,
        userId,
      })
      .first();

    if (!playlist) {
      throw new NotFoundException("Playlist not found");
    }

    const existingItem = await db.orm.public.PlaylistItem
      .where({
        playlistId,
        nuggetId,
      })
      .first();

    if (existingItem) {
      return {
        message: "Nugget is already in this folder",
        item: existingItem,
      };
    }

    const item = await db.orm.public.PlaylistItem.create({
      playlistId,
      nuggetId,
    });

    return {
      message: "Nugget added to folder",
      item,
    };
  }

  async removeItem(
    userId: number,
    playlistId: number,
    nuggetId: string
  ) {
    const playlist = await db.orm.public.Playlist
      .where({
        id: playlistId,
        userId,
      })
      .first();

    if (!playlist) {
      throw new NotFoundException("Playlist not found");
    }

    return db.orm.public.PlaylistItem
      .where({
        playlistId,
        nuggetId,
      })
      .delete();
  }
   
  async updatePlaylist(userId: number, playlistId: number, data: PlaylistNameDto) {
    await this.ensureMetadata();
    const [playlist] = await db.runtime().query(db.raw.sql`
      UPDATE "Playlist"
      SET "name" = ${data.name.trim()},
          "description" = CASE WHEN ${data.description !== undefined} THEN ${data.description?.trim() ?? ""} ELSE "description" END,
          "shareToken" = CASE
            WHEN ${data.privacy ?? ""} = 'private' THEN NULL
            WHEN ${data.privacy ?? ""} = 'shared' THEN COALESCE("shareToken", ${randomBytes(32).toString("hex")})
            ELSE "shareToken"
          END
      WHERE "id" = ${playlistId} AND "userId" = ${userId}
      RETURNING "id", "name", "description", COALESCE("shareToken", '') AS "shareToken"
    `.returnsRow({ id: "pg/int4@1", name: "pg/text@1", description: "pg/text@1", shareToken: "pg/text@1" }).build());
    if (!playlist) throw new NotFoundException("Playlist not found");
    return playlist;
  }

  async deletePlaylist(userId: number, playlistId: number) {
    const playlist = await db.orm.public.Playlist
      .where({
        id: playlistId,
        userId,
      })
      .first();

    if (!playlist) {
      throw new NotFoundException("Playlist not found");
    }

    return db.orm.public.Playlist
      .where({
        id: playlistId,
        userId,
      })
      .delete();
  }
}