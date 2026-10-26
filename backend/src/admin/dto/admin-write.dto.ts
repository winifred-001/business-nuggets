import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

import {
  ADMIN_PERMISSION_KEYS,
} from "../../auth/admin-permissions";

const ADMIN_ROLES = [
  "super-admin",
  "editor",
  "moderator",
  "support",
] as const;

const ACCOUNT_STATUSES = [
  "active",
  "overdue",
  "suspended",
] as const;

const MODERATION_STATUSES = [
  "pending",
  "approved",
  "flagged",
  "rejected",
] as const;

export class CreateTopicDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class ReorderTopicsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids!: number[];
}

export class UpdateTopicDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  displayOrder?: number;
}

export class CreateScriptureBookDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  chapterCount?: number;
}

export class UpdateScriptureBookDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  chapterCount?: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  displayOrder?: number;
}

export class ScheduleNuggetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  nuggetId!: string;

  @IsISO8601()
  scheduledFor!: string;
}

export class CreateAdminUserDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsIn(["free", "premium"])
  membershipTier?: string;

  @IsOptional()
  @IsIn(ACCOUNT_STATUSES)
  accountStatus?: string;
}

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsIn(["user", "admin"])
  role?: string;

  @IsOptional()
  @IsIn(["free", "premium"])
  membershipTier?: string;

  @IsOptional()
  @IsIn(ACCOUNT_STATUSES)
  accountStatus?: string;
}

export class CreateSubscriptionPlanDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(80)
  slug!: string;

  @IsInt()
  @Min(0)
  @Max(1000000000)
  priceCents!: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  currency?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(32)
  billingCycle!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  features?: string[];
}

export class UpdateSubscriptionPlanDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000000)
  priceCents?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  currency?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  billingCycle?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  features?: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateModerationStatusDto {
  @IsIn(MODERATION_STATUSES)
  status!: "pending" | "approved" | "flagged" | "rejected";
}

export class ReplyModerationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reply!: string;
}

export class BulkModerationDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids!: number[];

  @IsIn(["approve", "reject", "pending"])
  action!: "approve" | "reject" | "pending";
}

export class PublishMobileSettingsDto {
  @IsOptional()
  @IsBoolean()
  forceUpdate?: boolean;

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @IsBoolean()
  offlineReading?: boolean;

  @IsOptional()
  @IsBoolean()
  dailyNuggetWidget?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  homeBannerTitle?: string;
}

export class UpdateMobileOnboardingDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class UpdateMobileVersionDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  version?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000000)
  installCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;
}

export class CreateNotificationCampaignDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsIn(["in-app"])
  channel?: "in-app";

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  audience!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  platform!: string;

  @IsOptional()
  @IsISO8601()
  sendAt?: string;
}

export class UpdateNotificationStatusDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  status!: string;
}

export class CreateAdminAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsIn(ADMIN_ROLES)
  adminRole!: "super-admin" | "editor" | "moderator" | "support";
}

export class UpdateGeneralSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  siteName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  tagline?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  supportEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  defaultLanguage?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  dailyPublishTime?: string;
}

export class UpdateSecuritySettingsDto {
  @IsOptional()
  @IsBoolean()
  twoFactorAdmins?: boolean;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(10080)
  sessionTimeoutMinutes?: number;

  @IsOptional()
  @IsBoolean()
  ipAllowListEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  ipAllowList?: string[];
}

export class UpdateMaintenanceModeDto {
  @IsBoolean()
  enabled!: boolean;
}

export class UpdateRolePermissionDto {
  @IsIn(ADMIN_ROLES)
  role!: "super-admin" | "editor" | "moderator" | "support";

  @IsIn(ADMIN_PERMISSION_KEYS)
  permission!: (typeof ADMIN_PERMISSION_KEYS)[number];

  @IsBoolean()
  enabled!: boolean;
}

export class PromoteUserDto {
  @IsIn(ADMIN_ROLES)
  adminRole!: "super-admin" | "editor" | "moderator" | "support";
}

export class UpdateAdminAccessDto {
  @IsOptional()
  @IsIn(ADMIN_ROLES)
  adminRole?: "super-admin" | "editor" | "moderator" | "support";

  @IsOptional()
  @IsIn(["active", "suspended"])
  accountStatus?: "active" | "suspended";
}
