import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomInt,
} from "node:crypto";

import {
  generateSecret,
  verify,
} from "otplib";

import { db } from "../prisma/db";
import { EmailService } from "../email/email.service";

@Injectable()
export class TwoFactorService {
  constructor(
    private readonly emailService: EmailService,
  ) {}

  private readonly algorithm =
    "aes-256-gcm";

  private readonly recoveryCodeAlphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  private readonly recoveryCodeCount =
    8;

  /* =========================================================
     ENCRYPTION KEY
  ========================================================= */

  private getEncryptionKey() {
    const key =
      process.env
        .TWO_FACTOR_ENCRYPTION_KEY;

    if (!key) {
      throw new ServiceUnavailableException(
        "Admin two-factor authentication is not configured on the server. Set TWO_FACTOR_ENCRYPTION_KEY in the backend environment.",
      );
    }

    if (
      !/^[0-9a-fA-F]{64}$/.test(
        key,
      )
    ) {
      throw new ServiceUnavailableException(
        "TWO_FACTOR_ENCRYPTION_KEY must contain exactly 64 hexadecimal characters.",
      );
    }

    return Buffer.from(
      key,
      "hex",
    );
  }

  /* =========================================================
     ENCRYPT 2FA SECRET
  ========================================================= */

  private encryptSecret(
    secret: string,
  ) {
    const iv =
      randomBytes(12);

    const cipher =
      createCipheriv(
        this.algorithm,
        this.getEncryptionKey(),
        iv,
      );

    const encrypted =
      Buffer.concat([
        cipher.update(
          secret,
          "utf8",
        ),

        cipher.final(),
      ]);

    const authTag =
      cipher.getAuthTag();

    return [
      "v1",

      iv.toString(
        "base64",
      ),

      authTag.toString(
        "base64",
      ),

      encrypted.toString(
        "base64",
      ),
    ].join(":");
  }

  /* =========================================================
     DECRYPT 2FA SECRET
  ========================================================= */

  private decryptSecret(
    storedValue: string,
  ) {
    /*
      Compatibility with any older records that stored the TOTP
      secret directly before encrypted secrets were introduced.
    */
    if (!storedValue.startsWith("v1:")) {
      return storedValue;
    }

    const [
      version,
      ivValue,
      authTagValue,
      encryptedValueBase64,
    ] =
      storedValue.split(
        ":",
      );

    if (
      version !== "v1" ||
      !ivValue ||
      !authTagValue ||
      !encryptedValueBase64
    ) {
      throw new ServiceUnavailableException(
        "The stored two-factor authentication secret is invalid. Reconfigure 2FA for this administrator.",
      );
    }

    try {
      const decipher =
        createDecipheriv(
          this.algorithm,
          this.getEncryptionKey(),

          Buffer.from(
            ivValue,
            "base64",
          ),
        );

      decipher.setAuthTag(
        Buffer.from(
          authTagValue,
          "base64",
        ),
      );

      const decrypted =
        Buffer.concat([
          decipher.update(
            Buffer.from(
              encryptedValueBase64,
              "base64",
            ),
          ),

          decipher.final(),
        ]);

      return decrypted.toString(
        "utf8",
      );
    } catch (error) {
      if (
        error instanceof
        ServiceUnavailableException
      ) {
        throw error;
      }

      throw new ServiceUnavailableException(
        "The server cannot decrypt this administrator's two-factor secret. Ensure TWO_FACTOR_ENCRYPTION_KEY is the same key that was used when 2FA was configured, or reset and configure 2FA again.",
      );
    }
  }

  /* =========================================================
     RECOVERY CODE HELPERS
  ========================================================= */

  private generateRecoveryCodePart(
    length: number,
  ) {
    let value =
      "";

    for (
      let index = 0;
      index < length;
      index++
    ) {
      value +=
        this.recoveryCodeAlphabet[
          randomInt(
            0,
            this.recoveryCodeAlphabet.length,
          )
        ];
    }

    return value;
  }

  private generateRecoveryCode() {
    const firstPart =
      this.generateRecoveryCodePart(
        5,
      );

    const secondPart =
      this.generateRecoveryCodePart(
        5,
      );

    return `BN-${firstPart}-${secondPart}`;
  }

  private generateRecoveryCodes() {
    const recoveryCodes =
      new Set<string>();

    while (
      recoveryCodes.size <
      this.recoveryCodeCount
    ) {
      recoveryCodes.add(
        this.generateRecoveryCode(),
      );
    }

    return Array.from(
      recoveryCodes,
    );
  }

  private normalizeRecoveryCode(
    recoveryCode: string,
  ) {
    return recoveryCode
      .trim()
      .toUpperCase()
      .replace(
        /\s+/g,
        "",
      );
  }

  private hashRecoveryCode(
    recoveryCode: string,
  ) {
    const normalizedCode =
      this.normalizeRecoveryCode(
        recoveryCode,
      );

    return createHash(
      "sha256",
    )
      .update(
        normalizedCode,
      )
      .digest(
        "hex",
      );
  }

  /* =========================================================
     GET ADMIN USER
  ========================================================= */

  private async getAdminUser(
    userId: number,
  ) {
    const user =
      await db.orm.public.User
        .where({
          id:
            userId,
        })
        .first();

    if (!user) {
      throw new UnauthorizedException(
        "User not found",
      );
    }

    const isAdmin =
      user.role ===
        "owner" ||
      Boolean(
        user.adminRole,
      );

    if (!isAdmin) {
      throw new UnauthorizedException(
        "Two-factor authentication setup is only available to administrators",
      );
    }

    return user;
  }

  /* =========================================================
     BEGIN 2FA SETUP
  ========================================================= */

  async beginSetup(
    userId: number,
  ) {
    const user =
      await this.getAdminUser(
        userId,
      );

    const secret =
      generateSecret();

    const encryptedSecret =
      this.encryptSecret(
        secret,
      );

    await db.orm.public.User
      .where({
        id:
          user.id,
      })
      .update({
        twoFactorSecret:
          encryptedSecret,

        twoFactorEnabled:
          false,

        twoFactorRecoveryCodes:
          [],
      });

    const issuer =
      "Business Nuggets";

    const label =
      `${issuer}:${user.email}`;

    const otpauthUrl =
      `otpauth://totp/${encodeURIComponent(
        label,
      )}` +
      `?secret=${encodeURIComponent(
        secret,
      )}` +
      `&issuer=${encodeURIComponent(
        issuer,
      )}` +
      `&algorithm=SHA1` +
      `&digits=6` +
      `&period=30`;

    return {
      message:
        "Two-factor authentication setup started",

      secret,
      otpauthUrl,
    };
  }

  /* =========================================================
     CONFIRM 2FA SETUP
  ========================================================= */

  async confirmSetup(
    userId: number,
    token: string,
  ) {
    const user =
      await this.getAdminUser(
        userId,
      );

    if (
      !user.twoFactorSecret
    ) {
      throw new BadRequestException(
        "Start two-factor authentication setup first",
      );
    }

    const secret =
      this.decryptSecret(
        user.twoFactorSecret,
      );

    const result =
      await verify({
        secret,
        token,
      });

    if (!result.valid) {
      throw new UnauthorizedException(
        "Invalid authentication code",
      );
    }

    /* =======================================================
       GENERATE ONE-TIME RECOVERY CODES
    ======================================================= */

    const recoveryCodes =
      this.generateRecoveryCodes();

    const recoveryCodeHashes =
      recoveryCodes.map(
        (
          recoveryCode,
        ) =>
          this.hashRecoveryCode(
            recoveryCode,
          ),
      );

    await db.orm.public.User
      .where({
        id:
          user.id,
      })
      .update({
        twoFactorEnabled:
          true,

        twoFactorRecoveryCodes:
          recoveryCodeHashes,
      });

    /* =======================================================
       2FA ENABLED SECURITY EMAIL
    ======================================================= */

    try {
      await this.emailService.sendTwoFactorEnabledEmail(
        user.email,
      );
    } catch (error) {
      console.error(
        "Failed to send 2FA enabled email:",
        error,
      );
    }

    /*
      IMPORTANT:
      These plain recovery codes are returned only here.
      The database contains only their hashes.
    */

    return {
      message:
        "Two-factor authentication enabled successfully",

      recoveryCodes,
    };
  }

  /* =========================================================
     VERIFY AUTHENTICATOR CODE
  ========================================================= */

  async verifyCode(
    userId: number,
    token: string,
  ) {
    const user =
      await db.orm.public.User
        .where({
          id:
            userId,
        })
        .first();

    if (
      !user ||
      !user.twoFactorEnabled ||
      !user.twoFactorSecret
    ) {
      return false;
    }

    const secret =
      this.decryptSecret(
        user.twoFactorSecret,
      );

    const result =
      await verify({
        secret,
        token,
      });

    return result.valid;
  }

  /* =========================================================
     VERIFY AND CONSUME RECOVERY CODE
  ========================================================= */

  async verifyRecoveryCode(
    userId: number,
    recoveryCode: string,
  ) {
    const user =
      await db.orm.public.User
        .where({
          id:
            userId,
        })
        .first();

    if (
      !user ||
      !user.twoFactorEnabled
    ) {
      return false;
    }

    if (
      !recoveryCode ||
      !Array.isArray(
        user.twoFactorRecoveryCodes,
      ) ||
      user.twoFactorRecoveryCodes.length ===
        0
    ) {
      return false;
    }

    const recoveryCodeHash =
      this.hashRecoveryCode(
        recoveryCode,
      );

    const codeExists =
      user.twoFactorRecoveryCodes.includes(
        recoveryCodeHash,
      );

    if (!codeExists) {
      return false;
    }

    /*
      Remove the used code immediately.
      That makes every recovery code one-time use.
    */

    const remainingCodes =
      user.twoFactorRecoveryCodes.filter(
        (
          storedHash,
        ) =>
          storedHash !==
          recoveryCodeHash,
      );

    await db.orm.public.User
      .where({
        id:
          user.id,
      })
      .update({
        twoFactorRecoveryCodes:
          remainingCodes,
      });

    return true;
  }

  /* =========================================================
     DISABLE 2FA
  ========================================================= */

  async disable(
    userId: number,
  ) {
    const user =
      await this.getAdminUser(
        userId,
      );

    await db.orm.public.User
      .where({
        id:
          user.id,
      })
      .update({
        twoFactorEnabled:
          false,

        twoFactorSecret:
          null,

        twoFactorRecoveryCodes:
          [],
      });

    return {
      message:
        "Two-factor authentication disabled",
    };
  }
}
