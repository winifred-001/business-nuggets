import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
} from "class-validator";

export class UpdateNuggetDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  scriptureRef?: string;

  @IsOptional()
  @IsString()
  scriptureText?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  keyPrinciple?: string;

  @IsOptional()
  @IsString()
  marketplaceApplication?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  practicalActionPlan?: string[];

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsBoolean()
  isGold?: boolean;

  @IsOptional()
  @IsString()
  book?: string;

  @IsOptional()
  @IsString()
  bibleSection?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  challenges?: string[];

  @IsOptional()
  @IsIn(["draft", "published"])
  status?: "draft" | "published";

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  audioUrl?: string;

  @IsOptional()
  @IsString()
  nuggetAudioUrl?: string;
}