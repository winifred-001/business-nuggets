import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from "class-validator";

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  @Length(6, 6)
  twoFactorToken?: string;
   
  @IsOptional()
  @IsString()
  @Matches(
    /^BN-[A-Z2-9]{5}-[A-Z2-9]{5}$/i,
    {
      message:
        "Invalid recovery code format",
    },
  )
  recoveryCode?: string;
}