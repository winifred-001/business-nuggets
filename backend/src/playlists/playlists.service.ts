import { Injectable, NotFoundException } from "@nestjs/common";
import { db } from "../prisma/db";

@Injectable()
export class PlaylistsService {
  async createPlaylist(userId: number, name: string) {
    return db.orm.public.Playlist.create({
      userId,
      name,
    });
  }

  async getPlaylists(userId: number) {
    const playlists = await db.orm.public.Playlist
      .where({ userId })
      .all();

    return Promise.all(
      playlists.map(async (playlist) => {
        const items = await db.orm.public.PlaylistItem
          .where({ playlistId: playlist.id })
          .all();

        return {
          ...playlist,
          items,
        };
      })
    );
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