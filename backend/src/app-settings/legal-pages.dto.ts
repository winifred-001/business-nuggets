import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, Length, Matches, MaxLength, ValidateNested } from 'class-validator';

export class LegalSectionDto {
  @IsString()
  @Length(1, 80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  id: string;

  @IsString()
  @Length(1, 200)
  @Matches(/\S/)
  title: string;

  @IsString()
  @Length(1, 10000)
  @Matches(/\S/)
  body: string;
}

export class UpdateLegalPageDto {
  @IsString()
  @Length(1, 200)
  @Matches(/\S/)
  title: string;

  @IsString()
  @MaxLength(3000)
  introduction: string;

  @IsString()
  @MaxLength(3000)
  notice: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => LegalSectionDto)
  sections: LegalSectionDto[];
}
