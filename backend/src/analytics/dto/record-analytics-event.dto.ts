import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class RecordAnalyticsEventDto {
  @IsString()
  @MaxLength(128)
  visitorId!: string;

  @IsIn(["view", "read", "share"])
  eventType!: "view" | "read" | "share";

  @IsOptional()
  @IsString()
  @MaxLength(128)
  nuggetId?: string;

  @IsOptional()
  @IsIn(["web", "ios", "android"])
  platform?: "web" | "ios" | "android";

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(14400)
  durationSeconds?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;
}
