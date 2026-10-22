import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

import {
  AppSettingsService,
} from "../app-settings/app-settings.service";

@Injectable()
export class AdminIpAllowListGuard
  implements CanActivate
{
  constructor(
    private readonly appSettingsService:
      AppSettingsService,
  ) {}

  private normalizeIp(
    ip?: string,
  ) {
    if (!ip) {
      return "";
    }

    if (
      ip.startsWith(
        "::ffff:",
      )
    ) {
      return ip.replace(
        "::ffff:",
        "",
      );
    }

    return ip;
  }

  async canActivate(
    context:
      ExecutionContext,
  ) {
    const settings =
      await this.appSettingsService.getSettings();

    if (
      !settings.ipAllowListEnabled
    ) {
      return true;
    }

    const request =
      context
        .switchToHttp()
        .getRequest();

    const requestIp =
      this.normalizeIp(
        request.ip,
      );

    const allowedIps =
      (
        settings.ipAllowList ??
        []
      ).map((ip) =>
        this.normalizeIp(ip),
      );

    if (
      allowedIps.length ===
      0
    ) {
      throw new ForbiddenException(
        "Admin IP allow-list is enabled but no IP addresses are configured",
      );
    }

    if (
      !allowedIps.includes(
        requestIp,
      )
    ) {
      throw new ForbiddenException(
        "This IP address is not allowed to access the admin area",
      );
    }

    return true;
  }
}