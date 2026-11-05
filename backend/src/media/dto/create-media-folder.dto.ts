import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateMediaFolderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;
}
