import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";

import { NotesService } from "./notes.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";

@Controller("notes")
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(
    private readonly notesService: NotesService,
  ) {}

  @Post()
  createNote(
    @Request() req: any,
    @Body() body: CreateNoteDto,
  ) {
    return this.notesService.createNote(
      req.user.sub,
      body.title,
      body.content,
      body.nuggetId,
    );
  }

  @Get()
  getNotes(@Request() req: any) {
    return this.notesService.getNotes(
      req.user.sub,
    );
  }

  @Patch(":id")
  updateNote(
    @Request() req: any,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateNoteDto,
  ) {
    return this.notesService.updateNote(
      req.user.sub,
      id,
      body,
    );
  }

  @Delete(":id")
  deleteNote(
    @Request() req: any,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.notesService.deleteNote(
      req.user.sub,
      id,
    );
  }
}
