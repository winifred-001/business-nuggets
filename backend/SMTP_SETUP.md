# Business Nuggets SMTP setup

Business Nuggets sends transactional email with Nodemailer over SMTP.
The deployed backend must have valid SMTP credentials before admin email OTP can work.

## Required Render environment variables

For Gmail SMTP, configure the backend Render service with:

```env
FRONTEND_URL=https://business-nuggets-theta.vercel.app

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASS=your-16-character-google-app-password
SMTP_FROM=Business Nuggets <your-gmail-address@gmail.com>
```

Optional:

```env
SMTP_REPLY_TO=your-support-address@example.com
EMAIL_OTP_SECRET=use-a-long-random-secret
```

If `EMAIL_OTP_SECRET` is omitted, the admin email OTP hashing falls back to `JWT_SECRET`.

Never commit real SMTP passwords or App Passwords. Store production secrets only in Render's environment-variable configuration.

## Gmail requirement

For Gmail SMTP, `SMTP_PASS` must be a Google App Password, not the normal Google account password. The Google account must have 2-Step Verification enabled before an App Password can be created.

For Gmail with STARTTLS:

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

Port 465 uses implicit TLS and normally requires `SMTP_SECURE=true`.

## Email flows covered

The backend sends email for:

- welcome email after registration
- password reset links
- password changed confirmation
- admin 6-digit email OTP sign-in codes
- admin invitations
- admin email-verification/security notices
- security alerts where triggered by the application

Admin invitation links resolve to `/admin/login`.

## Password-reset flow

1. Frontend posts the email address to `POST /auth/forgot-password`.
2. Backend generates a short-lived reset token.
3. SMTP sends a link to `FRONTEND_URL/reset-password?token=...`.
4. The reset page posts `{ token, newPassword }` to `POST /auth/reset-password`.
5. On success, the frontend redirects to `/password-reset-success`.

The forgot-password endpoint intentionally gives a generic response so people cannot use it to discover which email addresses have accounts.

## Admin email OTP flow

1. Admin submits email and password to `POST /auth/login`.
2. If admin email verification is required, the backend generates a one-time 6-digit code.
3. SMTP sends the code to the admin account email.
4. Frontend posts the code and temporary challenge token to `POST /auth/2fa/verify-email`.
5. Only after successful verification does the backend issue the admin JWT.

## Production / Render

Set the SMTP variables in the Render backend service's **Environment** section.

After changing environment variables, choose **Save, rebuild, and deploy**.

The key must be exactly `SMTP_PORT` (not `MTP_PORT`).

## SMTP health check

After deployment, open:

```text
https://business-nuggets-api.onrender.com/health/email
```

A working configuration returns information similar to:

```json
{
  "configured": true,
  "connected": true,
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "message": "SMTP connection verified successfully."
}
```

If configuration is missing, the response lists the missing environment-variable names.

If Gmail rejects the App Password, the response reports an SMTP authentication failure without exposing credentials.

## Final verification

After `/health/email` reports `connected: true`:

1. Sign in to `/admin/login` and confirm the 6-digit OTP arrives.
2. Complete the OTP and enter the Admin Console.
3. Request a password reset from `/forgot-password` and confirm the reset email arrives.
4. Register a test account and confirm the welcome email arrives.
5. Create an admin and confirm the invitation opens `/admin/login`.
