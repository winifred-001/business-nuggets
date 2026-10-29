import { ArrayUnique, IsArray, IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SaveCollectionDto {
  @IsString() @MinLength(1) @MaxLength(200) title: string;
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(200) slug: string;
  @IsString() @MaxLength(5000) description: string;
  @IsString() @MaxLength(2000) image: string;
  @IsBoolean() visible: boolean;
  @IsArray() @ArrayUnique() @IsString({ each: true }) nuggetIds: string[];
  @IsOptional() @IsString() updatedAt?: string;
}
