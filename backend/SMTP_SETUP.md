# Business Nuggets SMTP setup

Business Nuggets sends transactional email with Nodemailer over SMTP.
No email API provider is required by the application code.

## Required environment variables

Configure these locally in `backend/.env` and in the Render service environment:

```env
FRONTEND_URL=https://business-nuggets-theta.vercel.app

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=Business Nuggets <no-reply@example.com>
SMTP_REPLY_TO=support@example.com
```

`SMTP_REPLY_TO` is optional.

Use `SMTP_SECURE=true` for implicit TLS, normally port 465.
For STARTTLS on port 587, use `SMTP_SECURE=false`.

Never commit the real SMTP password. Store production credentials only
in Render's environment-variable configuration.

## Email flows already covered

The backend sends SMTP email for:

- welcome email after registration
- password reset links
- password changed confirmation after a reset
- password changed confirmation when a signed-in user changes it
- admin invitations
- 2FA enabled confirmation
- new-device security alerts

## Password-reset flow

1. Frontend posts the email address to `POST /auth/forgot-password`.
2. Backend generates a short-lived reset token.
3. SMTP sends a link to `FRONTEND_URL/reset-password?token=...`.
4. The reset page posts `{ token, newPassword }` to `POST /auth/reset-password`.
5. On success, the frontend redirects to `/password-reset-success`.

The forgot-password endpoint intentionally gives a generic response so
people cannot use it to discover which email addresses have accounts.

## Local setup

From `backend/`:

```bash
cp .env.example .env
npm install
npm run start:dev
```

Fill in your actual local SMTP credentials in `.env`.

## Production / Render

Set the SMTP variables in the Render backend service's Environment
section. `FRONTEND_URL` should be the deployed frontend origin without
a trailing slash:

```text
https://business-nuggets-theta.vercel.app
```

After changing environment variables, redeploy/restart the backend.

## Verification

After deployment, test:

1. Register with an email you can receive.
2. Request a password reset from `/forgot-password`.
3. Open the received reset link and set a new password.
4. Confirm `/password-reset-success` is shown.
5. Create an admin and confirm the invitation arrives.
6. Sign in from a second browser/device and confirm the security alert.
