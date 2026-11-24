import { IsBoolean, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateTopUpBundleDto {
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(80)
  slug!: string;
  @IsString() @MinLength(1) @MaxLength(100)
  name!: string;
  @IsInt() @Min(1) @Max(10000)
  credits!: number;
  @IsInt() @Min(1) @Max(1000000000)
  priceCents!: number;
  @IsString() @Matches(/^[A-Z]{3}$/)
  currency!: string;
}

export class UpdateTopUpBundleDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100)
  name?: string;
  @IsOptional() @IsInt() @Min(1) @Max(10000)
  credits?: number;
  @IsOptional() @IsInt() @Min(1) @Max(1000000000)
  priceCents?: number;
  @IsOptional() @IsString() @Matches(/^[A-Z]{3}$/)
  currency?: string;
  @IsOptional() @IsBoolean()
  active?: boolean;
}
