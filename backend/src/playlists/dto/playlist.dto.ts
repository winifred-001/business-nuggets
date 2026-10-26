import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from "class-validator";

export class PlaylistNameDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}

export class PlaylistItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  nuggetId!: string;
}
