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
  twoFactorEnabledEmailTemplate,
  welcomeEmailTemplate,
} from "./email.templates";

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

    if (
      !Number.isInteger(port) ||
      port <= 0
    ) {
      throw new InternalServerErrorException(
        "SMTP_PORT must be a valid positive integer",
      );
    }

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
      process.env.SMTP_SECURE !==
      undefined
        ? process.env.SMTP_SECURE ===
          "true"
        : port === 465;

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

  private getFromAddress() {
    return (
      process.env.SMTP_FROM ||
      process.env.SMTP_USER
    );
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
}
