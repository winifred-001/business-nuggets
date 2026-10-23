import {
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";

import nodemailer, {
  Transporter,
} from "nodemailer";

import {
  adminInviteEmailTemplate,
  adminLoginCodeEmailTemplate,
  passwordChangedEmailTemplate,
  passwordResetEmailTemplate,
  securityAlertEmailTemplate,
  smtpTestEmailTemplate,
  twoFactorEnabledEmailTemplate,
  welcomeEmailTemplate,
} from "./email.templates";

type SmtpError = Error & {
  code?: string;
  command?: string;
  responseCode?: number;
};

@Injectable()
export class EmailService {
  private transporter:
    Transporter | null =
    null;

  private isConfigured() {
    return Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
  }

  private getMissingConfiguration() {
    const missing: string[] = [];

    if (!process.env.SMTP_HOST) {
      missing.push("SMTP_HOST");
    }

    if (!process.env.SMTP_USER) {
      missing.push("SMTP_USER");
    }

    if (!process.env.SMTP_PASS) {
      missing.push("SMTP_PASS");
    }

    return missing;
  }

  private getPort() {
    const port =
      Number(
        process.env.SMTP_PORT ??
        "587",
      );

    if (
      !Number.isInteger(port) ||
      port <= 0
    ) {
      throw new InternalServerErrorException(
        "SMTP_PORT must be a valid positive integer",
      );
    }

    return port;
  }

  private getSecure(
    port: number,
  ) {
    return process.env.SMTP_SECURE !==
      undefined
      ? process.env.SMTP_SECURE ===
        "true"
      : port === 465;
  }

  private getTransporter() {
    if (
      this.transporter
    ) {
      return this.transporter;
    }

    const host =
      process.env.SMTP_HOST;

    const user =
      process.env.SMTP_USER;

    const pass =
      process.env.SMTP_PASS;

    if (
      !host ||
      !user ||
      !pass
    ) {
      throw new InternalServerErrorException(
        "Email service is not configured",
      );
    }

    const port =
      this.getPort();

    const secure =
      this.getSecure(
        port,
      );

    this.transporter =
      nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        connectionTimeout:
          10_000,
        greetingTimeout:
          10_000,
        socketTimeout:
          20_000,
      });

    return this.transporter;
  }

  private getFromAddress() {
    return (
      process.env.SMTP_FROM ||
      process.env.SMTP_USER
    );
  }

  private describeSmtpError(
    error: unknown,
  ) {
    const smtpError =
      error as SmtpError;

    switch (
      smtpError?.code
    ) {
      case "EAUTH":
        return "SMTP authentication failed. Check SMTP_USER and the Gmail App Password in SMTP_PASS.";

      case "ECONNECTION":
      case "ESOCKET":
      case "ETIMEDOUT":
        return "Could not connect to the SMTP server. Check SMTP_HOST, SMTP_PORT, SMTP_SECURE, and the provider connection.";

      default:
        return "SMTP connection failed. Check the Render email environment variables and provider settings.";
    }
  }

  async getDeliveryStatus() {
    const missing =
      this.getMissingConfiguration();

    if (
      missing.length > 0
    ) {
      return {
        configured:
          false,
        connected:
          false,
        missing,
        message:
          "SMTP is not fully configured.",
      };
    }

    try {
      await this.getTransporter().verify();

      const port =
        this.getPort();

      return {
        configured:
          true,
        connected:
          true,
        host:
          process.env.SMTP_HOST,
        port,
        secure:
          this.getSecure(
            port,
          ),
        from:
          this.getFromAddress(),
        message:
          "SMTP connection verified successfully.",
      };
    } catch (error) {
      console.error(
        "SMTP verification failed:",
        error,
      );

      const smtpError =
        error as SmtpError;

      return {
        configured:
          true,
        connected:
          false,
        code:
          smtpError?.code ??
          "UNKNOWN",
        message:
          this.describeSmtpError(
            error,
          ),
      };
    }
  }

  private async sendEmail(
    to: string,
    template: {
      subject: string;
      text: string;
      html: string;
    },
  ) {
    if (
      !this.isConfigured()
    ) {
      console.warn(
        `Email skipped because SMTP is not configured: ${template.subject}`,
      );

      return {
        message:
          "Email skipped because SMTP is not configured",
      };
    }

    try {
      const transporter =
        this.getTransporter();

      await transporter.sendMail({
        from:
          this.getFromAddress(),
        to,
        replyTo:
          process.env.SMTP_REPLY_TO ||
          undefined,
        subject:
          template.subject,
        text:
          template.text,
        html:
          template.html,
      });

      return {
        message:
          "Email sent successfully",
      };
    } catch (error) {
      console.error(
        `Email delivery failed for ${template.subject}:`,
        error,
      );

      throw new InternalServerErrorException(
        "Email delivery failed",
      );
    }
  }

  async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
  ) {
    return this.sendEmail(
      to,
      passwordResetEmailTemplate(
        resetUrl,
      ),
    );
  }

  async sendWelcomeEmail(
    to: string,
    name: string,
  ) {
    return this.sendEmail(
      to,
      welcomeEmailTemplate(
        name,
      ),
    );
  }

  async sendPasswordChangedEmail(
    to: string,
  ) {
    return this.sendEmail(
      to,
      passwordChangedEmailTemplate(),
    );
  }

  async sendAdminLoginCodeEmail(
    to: string,
    code: string,
    expiresInMinutes: number,
  ) {
    return this.sendEmail(
      to,
      adminLoginCodeEmailTemplate(
        code,
        expiresInMinutes,
      ),
    );
  }

  async sendTwoFactorEnabledEmail(
    to: string,
  ) {
    return this.sendEmail(
      to,
      twoFactorEnabledEmailTemplate(),
    );
  }

  async sendSecurityAlertEmail(
    to: string,
    message: string,
  ) {
    return this.sendEmail(
      to,
      securityAlertEmailTemplate(
        message,
      ),
    );
  }

  async sendAdminInviteEmail(
    to: string,
    name: string,
    loginUrl: string,
  ) {
    return this.sendEmail(
      to,
      adminInviteEmailTemplate(
        name,
        loginUrl,
      ),
    );
  }

  async sendSmtpTestEmail(
    to: string,
  ) {
    return this.sendEmail(
      to,
      smtpTestEmailTemplate(),
    );
  }
}
