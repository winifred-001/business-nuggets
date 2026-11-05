import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class RegisterPushTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsIn([
    "web",
    "android",
    "ios",
  ])
  platform: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceName?: string;
}