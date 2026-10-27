import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
export class CreateCategoryDto {
  @IsString() @Matches(/\S/) @MaxLength(120) name!: string;
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(1000)
  description?: string;
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  visible?: boolean;
}
export class UpdateCategoryDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(120)
  name?: string;
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(1000)
  description?: string;
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  visible?: boolean;
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(100000)
  displayOrder?: number;
}
export class CreateTopicDto extends CreateCategoryDto {
  @IsOptional() @IsInt() @Min(1) @Max(2147483647) categoryId?: number | null;
}
export class UpdateTopicDto extends UpdateCategoryDto {
  @IsOptional() @IsInt() @Min(1) @Max(2147483647) categoryId?: number | null;
}
