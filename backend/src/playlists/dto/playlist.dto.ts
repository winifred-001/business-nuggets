import {
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsString,
  MaxLength,
} from "class-validator";

export class PlaylistNameDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsOptional()
  @IsIn(["private", "shared"])
  privacy?: "private" | "shared";
}

export class PlaylistItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  nuggetId!: string;
}
