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

export function twoFactorEnabledEmailTemplate() {
  return {
    subject:
      "Two-factor authentication enabled",

    text: `
Two-factor authentication has been enabled on your Business Nuggets administrator account.

Your account now requires an authenticator code or recovery code when signing in.

If you did not make this change, contact support immediately.
    `.trim(),

    html: `
      <h2>Two-factor authentication enabled</h2>
      <p>
        Two-factor authentication has been enabled
        on your Business Nuggets administrator account.
      </p>
      <p>
        Your account now requires an authenticator code
        or recovery code when signing in.
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

You may be required to set up two-factor authentication during your first login.
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
        You may be required to set up two-factor
        authentication during your first login.
      </p>
    `.trim(),
  };
}