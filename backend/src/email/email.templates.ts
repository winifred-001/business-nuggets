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
      <h2>Reset your password</h2>
      <p>We received a request to reset your Business Nuggets password.</p>
      <p>
        <a href="${resetUrl}">
          Reset Password
        </a>
      </p>
      <p>This link expires in 15 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
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
      <h2>Welcome to Business Nuggets</h2>
      <p>Hi ${name},</p>
      <p>Your account has been created successfully.</p>
      <p>We're glad to have you with us.</p>
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
      <h2>Password changed</h2>
      <p>Your Business Nuggets password was changed successfully.</p>
      <p>If you made this change, no further action is required.</p>
      <p>
        If you did not change your password,
        contact support immediately.
      </p>
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
      "Two-factor authentication enabled",

    text: `
Two-factor authentication has been enabled on your Business Nuggets administrator account.

When admin email verification is required, a one-time sign-in code will be sent to your email address.

If you did not make this change, contact support immediately.
    `.trim(),

    html: `
      <h2>Two-factor authentication enabled</h2>
      <p>
        Two-factor authentication has been enabled
        on your Business Nuggets administrator account.
      </p>
      <p>
        When admin email verification is required,
        a one-time sign-in code will be sent to your email address.
      </p>
      <p>
        If you did not make this change,
        contact support immediately.
      </p>
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
      <h2>Security alert</h2>
      <p>${message}</p>
      <p>
        If this activity was not performed by you,
        secure your account immediately.
      </p>
    `.trim(),
  };
}

export function adminInviteEmailTemplate(
  name: string,
  loginUrl: string,
) {
  return {
    subject:
      "You've been invited to Business Nuggets Admin",

    text: `
Hi ${name},

You have been invited to join the Business Nuggets administration team.

Sign in here:
${loginUrl}

If two-factor authentication is required, a verification code will be sent to your email during sign-in.
    `.trim(),

    html: `
      <h2>Business Nuggets Admin Invitation</h2>
      <p>Hi ${name},</p>
      <p>
        You have been invited to join the
        Business Nuggets administration team.
      </p>
      <p>
        <a href="${loginUrl}">
          Sign In
        </a>
      </p>
      <p>
        If two-factor authentication is required,
        a verification code will be sent to your email during sign-in.
      </p>
    `.trim(),
  };
}
