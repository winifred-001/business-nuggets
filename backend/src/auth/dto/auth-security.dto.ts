import {
  IsEmail,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class TwoFactorTokenDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, {
    message:
      "Authentication code must be 6 digits",
  })
  token!: string;
}

export class TwoFactorSetupRequiredDto {
  @IsString()
  @MinLength(20)
  @MaxLength(4096)
  setupToken!: string;
}

export class TwoFactorConfirmRequiredDto {
  @IsString()
  @MinLength(20)
  @MaxLength(4096)
  setupToken!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, {
    message:
      "Authentication code must be 6 digits",
  })
  token!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(20)
  @MaxLength(4096)
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}
