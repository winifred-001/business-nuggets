import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsOptional, IsString, Length, Matches, MaxLength, ValidateIf, ValidateNested } from 'class-validator';

export const siteBlockKinds = ['text', 'image', 'quote', 'callout', 'button', 'divider', 'faq', 'author'] as const;

/** Content only: scripts and arbitrary HTML are not accepted. */
export class LegalSectionDto {
  @IsString() @Length(1, 80) @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  id: string;

  @IsString() @MaxLength(200)
  title: string;

  @IsString() @MaxLength(10000)
  body: string;

  @IsOptional() @IsIn(siteBlockKinds)
  kind?: (typeof siteBlockKinds)[number];

  @IsOptional() @IsIn(['full', 'half'])
  width?: 'full' | 'half';

  @IsOptional() @IsIn(['left', 'center'])
  alignment?: 'left' | 'center';

  @IsOptional() @IsIn(['plain', 'card', 'accent'])
  appearance?: 'plain' | 'card' | 'accent';

  @ValidateIf(value => Boolean(value.imageUrl))
  @IsString() @MaxLength(2000)
  @Matches(/^(?:https:\/\/[^\s]+|\/(?!\/)[^\s]*)$/)
  imageUrl?: string;

  @IsOptional() @IsString() @MaxLength(200)
  imageAlt?: string;

  @IsOptional() @IsString() @MaxLength(120)
  buttonText?: string;

  @ValidateIf(value => Boolean(value.buttonHref))
  @IsString() @MaxLength(2000)
  @Matches(/^(?:https:\/\/[^\s]+|\/(?!\/)[^\s]*)$/)
  buttonHref?: string;
}

export class UpdateLegalPageDto {
  @IsString() @Length(1, 200) @Matches(/\S/)
  title: string;

  @IsString() @MaxLength(3000)
  introduction: string;

  @IsString() @MaxLength(3000)
  notice: string;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => LegalSectionDto)
  sections: LegalSectionDto[];

  @IsOptional() @IsBoolean()
  published?: boolean;

  @IsOptional() @IsBoolean()
  showInNavigation?: boolean;

  @IsOptional() @IsString() @MaxLength(80)
  navLabel?: string;

  @IsOptional() @IsString() @MaxLength(500)
  metaDescription?: string;
}

export class CreateSitePageDto extends UpdateLegalPageDto {
  @IsString() @Length(2, 80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug: string;
}
