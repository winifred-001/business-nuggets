import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { db } from "../prisma/db";

@Injectable()
export class NotesService {
  async createNote(
    userId: number,
    title: string | undefined,
    content: string,
    nuggetId?: string
  ) {
    return db.orm.public.Note.create({
      userId,
      title,
      content,
      nuggetId,
    });
  }

  async getNotes(userId: number) {
    return db.orm.public.Note
      .where({ userId })
      .all();
  }

  async updateNote(
    userId: number,
    noteId: number,
    data: {
      title?: string;
      content?: string;
      nuggetId?: string;
    }
  ) {
    const note = await db.orm.public.Note
      .where({
        id: noteId,
        userId,
      })
      .first();

    if (!note) {
      throw new NotFoundException("Note not found");
    }

    return db.orm.public.Note
      .where({
        id: noteId,
        userId,
      })
      .update(data);
  }

  async deleteNote(
    userId: number,
    noteId: number
  ) {
    const note = await db.orm.public.Note
      .where({
        id: noteId,
        userId,
      })
      .first();

    if (!note) {
      throw new NotFoundException("Note not found");
    }

    return db.orm.public.Note
      .where({
        id: noteId,
        userId,
      })
      .delete();
  }
}