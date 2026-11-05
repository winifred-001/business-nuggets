import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateNuggetDto {
  @IsInt()
  number: number;

  @IsString()
  slug: string;

  @IsString()
  title: string;

  @IsString()
  topic: string;

  @IsString()
  tag: string;

  @IsString()
  scriptureRef: string;

  @IsString()
  scriptureText: string;

  @IsString()
  image: string;

  @IsString()
  keyPrinciple: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsString()
  marketplaceApplication: string;

  @IsArray()
  @IsString({ each: true })
  practicalActionPlan: string[];

  @IsString()
  duration: string;

  @IsOptional()
  @IsBoolean()
  isGold?: boolean;

  @IsString()
  book: string;

  @IsString()
  bibleSection: string;

  @IsArray()
  @IsString({ each: true })
  challenges: string[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  audioUrl?: string;

  @IsOptional()
  @IsString()
  nuggetAudioUrl?: string;

  @IsOptional()
  @IsString()
  publishedAt?: string;
}