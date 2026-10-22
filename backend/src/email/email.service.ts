import {
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";

import nodemailer, {
  Transporter,
} from "nodemailer";

import {
  adminInviteEmailTemplate,
  passwordChangedEmailTemplate,
  passwordResetEmailTemplate,
  securityAlertEmailTemplate,
  twoFactorEnabledEmailTemplate,
  welcomeEmailTemplate,
} from "./email.templates";

@Injectable()
export class EmailService {
  private transporter:
    Transporter | null =
    null;

  /* =========================================================
     SMTP CONFIG CHECK
  ========================================================= */

  private isConfigured() {
    return Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
  }

  /* =========================================================
     SMTP TRANSPORTER
  ========================================================= */

  private getTransporter() {
    if (
      this.transporter
    ) {
      return this.transporter;
    }

    const host =
      process.env.SMTP_HOST;

    const port =
      Number(
        process.env.SMTP_PORT ??
        "587",
      );

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

    const secure =
      process.env.SMTP_SECURE ===
      "true";

    this.transporter =
      nodemailer.createTransport({
        host,
        port,
        secure,

        auth: {
          user,
          pass,
        },
      });

    return this.transporter;
  }

  /* =========================================================
     FROM ADDRESS
  ========================================================= */

  private getFromAddress() {
    return (
      process.env.SMTP_FROM ||
      process.env.SMTP_USER
    );
  }

  /* =========================================================
     GENERIC EMAIL SENDER
  ========================================================= */

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

    const transporter =
      this.getTransporter();

    await transporter.sendMail({
      from:
        this.getFromAddress(),

      to,

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
  }

  /* =========================================================
     PASSWORD RESET
  ========================================================= */

  async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
  ) {
    const template =
      passwordResetEmailTemplate(
        resetUrl,
      );

    return this.sendEmail(
      to,
      template,
    );
  }

  /* =========================================================
     WELCOME EMAIL
  ========================================================= */

  async sendWelcomeEmail(
    to: string,
    name: string,
  ) {
    const template =
      welcomeEmailTemplate(
        name,
      );

    return this.sendEmail(
      to,
      template,
    );
  }

  /* =========================================================
     PASSWORD CHANGED
  ========================================================= */

  async sendPasswordChangedEmail(
    to: string,
  ) {
    const template =
      passwordChangedEmailTemplate();

    return this.sendEmail(
      to,
      template,
    );
  }

  /* =========================================================
     2FA ENABLED
  ========================================================= */

  async sendTwoFactorEnabledEmail(
    to: string,
  ) {
    const template =
      twoFactorEnabledEmailTemplate();

    return this.sendEmail(
      to,
      template,
    );
  }

  /* =========================================================
     SECURITY ALERT
  ========================================================= */

  async sendSecurityAlertEmail(
    to: string,
    message: string,
  ) {
    const template =
      securityAlertEmailTemplate(
        message,
      );

    return this.sendEmail(
      to,
      template,
    );
  }

  /* =========================================================
     ADMIN INVITATION
  ========================================================= */

  async sendAdminInviteEmail(
    to: string,
    name: string,
    loginUrl: string,
  ) {
    const template =
      adminInviteEmailTemplate(
        name,
        loginUrl,
      );

    return this.sendEmail(
      to,
      template,
    );
  }
}