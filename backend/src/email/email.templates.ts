export function passwordResetEmailTemplate(
  resetUrl: string,
) {
  return {
    subject:
      "Reset your Business Nuggets password",

    text: `
You requested a password reset for your Business Nuggets account.

Reset your password here:
${resetUrl}

This link expires in 15 minutes.

If you did not request this password reset, you can ignore this email.
    `.trim(),

    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #171717;">
        <h2>Reset your Business Nuggets password</h2>
        <p>We received a request to reset your password.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#C8A35A;color:#080808;text-decoration:none;font-weight:700;border-radius:6px;">
            Reset Password
          </a>
        </p>
        <p>This link expires in 15 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `.trim(),
  };
}

export function welcomeEmailTemplate(
  name: string,
) {
  return {
    subject:
      "Welcome to Business Nuggets",

    text: `
Hi ${name},

Welcome to Business Nuggets.

Your account has been created successfully.

We're glad to have you with us.
    `.trim(),

    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #171717;">
        <h2>Welcome to Business Nuggets</h2>
        <p>Hi ${name},</p>
        <p>Your account has been created successfully.</p>
        <p>We're glad to have you with us.</p>
      </div>
    `.trim(),
  };
}

export function passwordChangedEmailTemplate() {
  return {
    subject:
      "Your Business Nuggets password was changed",

    text: `
Your Business Nuggets password was changed successfully.

If you made this change, no further action is required.

If you did not change your password, contact support immediately.
    `.trim(),

    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #171717;">
        <h2>Password changed</h2>
        <p>Your Business Nuggets password was changed successfully.</p>
        <p>If you made this change, no further action is required.</p>
        <p>If you did not change your password, contact support immediately.</p>
      </div>
    `.trim(),
  };
}

export function adminLoginCodeEmailTemplate(
  code: string,
  expiresInMinutes: number,
) {
  return {
    subject:
      "Your Business Nuggets admin sign-in code",

    text: `
Business Nuggets Admin Verification

Your verification code is:

${code}

This code expires in ${expiresInMinutes} minutes and can only be used for this sign-in attempt.

If you did not attempt to sign in to the Business Nuggets Admin Console, you can ignore this email.
    `.trim(),

    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #171717;">
        <h2>Business Nuggets Admin Verification</h2>
        <p>Use this verification code to finish signing in:</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 24px 0;">
          ${code}
        </div>
        <p>This code expires in ${expiresInMinutes} minutes and can only be used for this sign-in attempt.</p>
        <p>If you did not attempt to sign in to the Business Nuggets Admin Console, you can ignore this email.</p>
      </div>
    `.trim(),
  };
}

export function twoFactorEnabledEmailTemplate() {
  return {
    subject:
      "Admin email verification enabled",

    text: `
Email verification has been enabled for your Business Nuggets administrator account.

When admin two-factor verification is required, a one-time sign-in code will be sent to your email address.

If you did not make this change, contact support immediately.
    `.trim(),

    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #171717;">
        <h2>Admin email verification enabled</h2>
        <p>Email verification has been enabled for your Business Nuggets administrator account.</p>
        <p>When admin two-factor verification is required, a one-time sign-in code will be sent to your email address.</p>
        <p>If you did not make this change, contact support immediately.</p>
      </div>
    `.trim(),
  };
}

export function securityAlertEmailTemplate(
  message: string,
) {
  return {
    subject:
      "Business Nuggets security alert",

    text: `
Security alert

${message}

If this activity was not performed by you, secure your account immediately.
    `.trim(),

    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #171717;">
        <h2>Security alert</h2>
        <p>${message}</p>
        <p>If this activity was not performed by you, secure your account immediately.</p>
      </div>
    `.trim(),
  };
}

export function adminInviteEmailTemplate(
  name: string,
  loginUrl: string,
) {
  const adminLoginUrl =
    /\/admin\/login\/?$/i.test(
      loginUrl,
    )
      ? loginUrl
      : loginUrl.replace(
          /\/login\/?$/i,
          "/admin/login",
        );

  return {
    subject:
      "You've been invited to Business Nuggets Admin",

    text: `
Hi ${name},

You have been invited to join the Business Nuggets administration team.

Sign in here:
${adminLoginUrl}

If admin email verification is required, a 6-digit verification code will be sent to your email during sign-in.
    `.trim(),

    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #171717;">
        <h2>Business Nuggets Admin Invitation</h2>
        <p>Hi ${name},</p>
        <p>You have been invited to join the Business Nuggets administration team.</p>
        <p>
          <a href="${adminLoginUrl}" style="display:inline-block;padding:12px 18px;background:#C8A35A;color:#080808;text-decoration:none;font-weight:700;border-radius:6px;">
            Open Admin Sign In
          </a>
        </p>
        <p>If admin email verification is required, a 6-digit verification code will be sent to your email during sign-in.</p>
      </div>
    `.trim(),
  };
}

export function smtpTestEmailTemplate() {
  return {
    subject:
      "Business Nuggets email test successful",

    text: `
Business Nuggets email delivery is working correctly.

This test confirms that the deployed backend can connect to the configured SMTP provider and send email.
    `.trim(),

    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #171717;">
        <h2>Email delivery is working</h2>
        <p>Business Nuggets successfully sent this message through the configured SMTP provider.</p>
      </div>
    `.trim(),
  };
}
