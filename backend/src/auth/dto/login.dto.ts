import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, {
    message:
      "Authentication code must be 6 digits",
  })
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
