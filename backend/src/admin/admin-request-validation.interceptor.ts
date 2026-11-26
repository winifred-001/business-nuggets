import { CreateTopicDto, UpdateTopicDto } from "../topics/topics.dto";
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Type,
  ValidationPipe,
} from "@nestjs/common";

import type {
  Observable,
} from "rxjs";

import {
  BulkModerationDto,
  CreateAdminAccountDto,
  CreateAdminUserDto,
  CreateNotificationCampaignDto,
  CreateScriptureBookDto,
  CreateSubscriptionPlanDto,
  PromoteUserDto,
  PublishMobileSettingsDto,
  ReorderTopicsDto,
  ReplyModerationDto,
  ScheduleNuggetDto,
  UpdateAdminAccessDto,
  UpdateAdminUserDto,
  UpdateGeneralSettingsDto,
  UpdateMaintenanceModeDto,
  UpdateMobileOnboardingDto,
  UpdateMobileVersionDto,
  UpdateModerationStatusDto,
  UpdateNotificationStatusDto,
  UpdateRolePermissionDto,
  UpdateScriptureBookDto,
  UpdateSecuritySettingsDto,
  UpdateSubscriptionPlanDto,
} from "./dto/admin-write.dto";

type DtoClass = Type<object>;

type RouteRule = {
  method: string;
  path: RegExp;
  dto: DtoClass;
};

const RULES: RouteRule[] = [
  { method: "POST", path: /^\/admin\/topics\/?$/, dto: CreateTopicDto },
  { method: "PATCH", path: /^\/admin\/topics\/reorder\/?$/, dto: ReorderTopicsDto },
  { method: "PATCH", path: /^\/admin\/topics\/[^/]+\/?$/, dto: UpdateTopicDto },

  { method: "POST", path: /^\/admin\/scripture\/books\/?$/, dto: CreateScriptureBookDto },
  { method: "PATCH", path: /^\/admin\/scripture\/books\/[^/]+\/?$/, dto: UpdateScriptureBookDto },

  { method: "POST", path: /^\/admin\/schedule\/?$/, dto: ScheduleNuggetDto },
  { method: "PATCH", path: /^\/admin\/schedule\/[^/]+\/?$/, dto: ScheduleNuggetDto },

  { method: "POST", path: /^\/admin\/users\/?$/, dto: CreateAdminUserDto },
  { method: "PATCH", path: /^\/admin\/users\/[^/]+\/?$/, dto: UpdateAdminUserDto },

  { method: "POST", path: /^\/admin\/subscriptions\/plans\/?$/, dto: CreateSubscriptionPlanDto },
  { method: "PATCH", path: /^\/admin\/subscriptions\/plans\/[^/]+\/?$/, dto: UpdateSubscriptionPlanDto },

  { method: "PATCH", path: /^\/admin\/moderation\/[^/]+\/status\/?$/, dto: UpdateModerationStatusDto },
  { method: "PATCH", path: /^\/admin\/moderation\/[^/]+\/reply\/?$/, dto: ReplyModerationDto },
  { method: "POST", path: /^\/admin\/moderation\/bulk\/?$/, dto: BulkModerationDto },

  { method: "PATCH", path: /^\/admin\/mobile\/settings\/?$/, dto: PublishMobileSettingsDto },
  { method: "PATCH", path: /^\/admin\/mobile\/onboarding\/[^/]+\/?$/, dto: UpdateMobileOnboardingDto },
  { method: "PATCH", path: /^\/admin\/mobile\/versions\/[^/]+\/?$/, dto: UpdateMobileVersionDto },

  { method: "POST", path: /^\/admin\/notifications\/?$/, dto: CreateNotificationCampaignDto },
  { method: "PATCH", path: /^\/admin\/notifications\/[^/]+\/status\/?$/, dto: UpdateNotificationStatusDto },

  { method: "POST", path: /^\/admin\/roles\/admins\/?$/, dto: CreateAdminAccountDto },
  { method: "PATCH", path: /^\/admin\/roles\/permissions\/?$/, dto: UpdateRolePermissionDto },
  { method: "PATCH", path: /^\/admin\/roles\/users\/[^/]+\/promote\/?$/, dto: PromoteUserDto },
  { method: "PATCH", path: /^\/admin\/roles\/admins\/[^/]+\/?$/, dto: UpdateAdminAccessDto },

  { method: "PATCH", path: /^\/admin\/settings\/general\/?$/, dto: UpdateGeneralSettingsDto },
  { method: "PATCH", path: /^\/admin\/settings\/security\/?$/, dto: UpdateSecuritySettingsDto },
  { method: "PATCH", path: /^\/admin\/settings\/maintenance\/?$/, dto: UpdateMaintenanceModeDto },
];

@Injectable()
export class AdminRequestValidationInterceptor
  implements NestInterceptor
{
  private readonly validationPipe =
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    });

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request =
      context
        .switchToHttp()
        .getRequest();

    const method =
      String(
        request.method ??
          "",
      ).toUpperCase();

    const path =
      String(
        request.originalUrl ??
          request.url ??
          "",
      ).split("?")[0];

    const rule =
      RULES.find(
        (candidate) =>
          candidate.method === method &&
          candidate.path.test(path),
      );

    if (rule) {
      request.body =
        await this.validationPipe.transform(
          request.body ?? {},
          {
            type: "body",
            metatype: rule.dto,
            data: undefined,
          },
        );
    }

    return next.handle();
  }
}
