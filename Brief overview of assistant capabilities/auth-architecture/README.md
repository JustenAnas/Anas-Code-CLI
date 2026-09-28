# MongoDB Authentication Starter

A Next.js 16 App Router / TypeScript starter for:

- Sign up with `name`, `email`, and `password`
- Log in with `email` and `password`
- Request a password-reset OTP by email
- Verify the OTP, then reset the password
- Maintain server-side sessions with a hashed session token in MongoDB

> This is backend architecture code. The existing `web/` app was not present in the provided sandbox, so these files are intentionally isolated and do not modify the ANAS CLI website prompt or UI.

## Flow

1. **Signup** → validate input → hash password with Argon2id → create user → issue HttpOnly session cookie.
2. **Login** → compare Argon2id hash → create a random session token → store only its SHA-256 hash → set HttpOnly cookie.
3. **Forgot password request** → always return a generic response → create a 6-digit OTP, store only its hash with a 10-minute expiry, send it by email.
4. **Verify OTP** → validate email + OTP + purpose + expiry + attempt limit → issue a short-lived reset token cookie.
5. **Reset password** → validate reset cookie → hash the new password → update user → invalidate all old sessions and reset token.
6. **Logout** → delete the current session and clear the cookie.

## Install

```bash
pnpm add mongodb argon2 jose zod nodemailer
pnpm add -D @types/nodemailer
```

Copy `.env.example` to `.env.local`, fill in MongoDB and SMTP values, then copy `src/` into your Next.js app's `src/` directory.

## Endpoints

| Method | Endpoint                            | Body                        |
| ------ | ----------------------------------- | --------------------------- |
| POST   | `/api/auth/signup`                  | `{ name, email, password }` |
| POST   | `/api/auth/login`                   | `{ email, password }`       |
| POST   | `/api/auth/logout`                  | none                        |
| GET    | `/api/auth/me`                      | none                        |
| POST   | `/api/auth/forgot-password/request` | `{ email }`                 |
| POST   | `/api/auth/forgot-password/verify`  | `{ email, otp }`            |
| POST   | `/api/auth/forgot-password/reset`   | `{ password }`              |

## Production checklist

- Use HTTPS so `Secure` cookies are effective.
- Set a strong random `SESSION_SECRET` and rotate it through your secret manager.
- Add rate limiting per IP and email to login and OTP routes.
- Add a real email provider and SPF/DKIM/DMARC.
- Add MongoDB indexes from `src/models/indexes.ts` during deployment.
- Do not log passwords, OTPs, reset tokens, or raw session tokens.
- Consider requiring email verification before granting normal access.
