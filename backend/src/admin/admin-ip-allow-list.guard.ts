import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import {
  createHmac,
  timingSafeEqual,
} from "crypto";

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

  private signedProxyIp(
    request: any,
  ) {
    const secret =
      process.env.ADMIN_PROXY_SECRET;

    if (!secret) {
      return "";
    }

    const rawIp =
      String(
        request.headers?.[
          "x-bn-client-ip"
        ] ?? "",
      ).trim();

    const signature =
      String(
        request.headers?.[
          "x-bn-client-ip-signature"
        ] ?? "",
      ).trim();

    if (
      !rawIp ||
      !signature
    ) {
      return "";
    }

    const expected =
      createHmac(
        "sha256",
        secret,
      )
        .update(rawIp)
        .digest("hex");

    if (
      signature.length !==
      expected.length
    ) {
      return "";
    }

    const valid =
      timingSafeEqual(
        Buffer.from(
          signature,
          "utf8",
        ),
        Buffer.from(
          expected,
          "utf8",
        ),
      );

    return valid
      ? this.normalizeIp(rawIp)
      : "";
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
      this.signedProxyIp(
        request,
      ) ||
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
