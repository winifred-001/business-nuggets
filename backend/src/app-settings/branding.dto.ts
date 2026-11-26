import { IsString, Matches, MaxLength } from "class-validator";
export class UpdateBrandingDto {
  @IsString() @MaxLength(2048) @Matches(/^(?:$|https:\/\/[^\s]+$)/)
  logoUrl: string;
  @IsString() @MaxLength(2048) @Matches(/^(?:$|https:\/\/[^\s]+$)/)
  faviconUrl: string;
  @IsString() @MaxLength(2048) @Matches(/^(?:$|https:\/\/[^\s]+$)/)
  socialImageUrl: string;
}
