import nodemailer from "nodemailer";

const port = Number(process.env.SMTP_PORT ?? 465);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://anas-cli.vercel.app";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

function emailLayout(content: string, footer: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ANAS CLI</title>
</head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#20252b;">
  <div style="display:none;font-size:1px;color:#f6f7f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Secure account notification from ANAS CLI.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f7f9;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:540px;">
          <tr>
            <td style="padding:0 0 24px 2px;">
              <span style="font-size:19px;font-weight:800;letter-spacing:-0.7px;color:#171b20;">ANAS</span>
              <span style="font-size:19px;font-weight:400;letter-spacing:-0.7px;color:#747b85;"> CLI</span>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border:1px solid #e6e8ec;border-radius:10px;padding:40px 36px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:25px 8px 0;text-align:center;">
              <p style="margin:0 0 9px;color:#8a9099;font-size:12px;line-height:19px;">
                ${footer}
              </p>
              <p style="margin:0;color:#a0a5ad;font-size:12px;line-height:19px;">
                © ${new Date().getFullYear()} ANAS CLI
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function otpContent(
  heading: string,
  description: string,
  otp: string,
  expiryMinutes: number,
  securityNote: string,
) {
  const safeOtp = escapeHtml(otp);

  return `
    <h1 style="margin:0 0 14px;font-size:25px;line-height:33px;font-weight:700;letter-spacing:-0.7px;color:#171b20;">
      ${heading}
    </h1>

    <p style="margin:0 0 28px;font-size:15px;line-height:25px;color:#59616b;">
      ${description}
    </p>

    <p style="margin:0 0 10px;font-size:11px;line-height:17px;font-weight:700;letter-spacing:1.3px;color:#828a94;">
      VERIFICATION CODE
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
      <tr>
        <td align="center" style="background:#f5f6f8;border:1px solid #e8eaee;border-radius:8px;padding:24px 12px;">
          <span style="font-family:Arial,Helvetica,sans-serif;font-size:34px;line-height:42px;font-weight:700;letter-spacing:7px;color:#171b20;">
            ${safeOtp}
          </span>
        </td>
      </tr>
    </table>

    <p style="margin:16px 0 0;font-size:13px;line-height:21px;color:#747c86;">
      This code expires in <strong style="color:#333941;">${expiryMinutes} minutes</strong>.
    </p>

    <div style="height:1px;background:#eceef1;margin:30px 0 24px;"></div>

    <p style="margin:0;font-size:13px;line-height:22px;color:#7b838d;">
      ${securityNote}
    </p>
  `;
}

function sendEmail(to: string, subject: string, html: string, text: string) {
  return transporter.sendMail({
    from: `"ANAS CLI" <${process.env.MAIL_FROM}>`,
    to,
    subject,
    html,
    text,
  });
}

// 1. Signup email verification
export function sendSignupVerificationOtp(email: string, otp: string) {
  const html = emailLayout(
    otpContent(
      "Verify your email address",
      "Enter the code below to verify your email and finish setting up your ANAS CLI account.",
      otp,
      2,
      "If you didn't create an ANAS CLI account, you can ignore this email. Never share this code with anyone.",
    ),
    "This is an automated account verification email.",
  );

  return sendEmail(
    email,
    "Verify your email — ANAS CLI",
    html,
    `Verify your email address

Use this code to complete your ANAS CLI signup:

${otp}

This code expires in 2 minutes.

If you didn't request this, ignore this email.
Never share your verification code.`,
  );
}

// 2. Password reset
export function sendPasswordResetOtp(email: string, otp: string) {
  const html = emailLayout(
    otpContent(
      "Reset your password",
      "We received a request to reset your ANAS CLI password. Use the code below to continue.",
      otp,
      2,
      "Didn't request a password reset? You can ignore this email. Your password will remain unchanged.",
    ),
    "This is an automated security notification.",
  );

  return sendEmail(
    email,
    "Reset your password — ANAS CLI",
    html,
    `Reset your ANAS CLI password

Your password reset code is:

${otp}

This code expires in 2 minutes.

If you didn't request this reset, ignore this email.
Your password will remain unchanged.`,
  );
}

// 3. Successful account creation
export function sendWelcomeEmail(email: string, name?: string) {
  const greeting = name?.trim()
    ? `Hi ${escapeHtml(name.trim())},`
    : "Hi there,";

  const html = emailLayout(
    `
    <p style="margin:0 0 18px;font-size:14px;line-height:22px;color:#59616b;">
      ${greeting}
    </p>

    <h1 style="margin:0 0 16px;font-size:25px;line-height:33px;font-weight:700;letter-spacing:-0.7px;color:#171b20;">
      Your account is ready.
    </h1>

    <p style="margin:0 0 18px;font-size:15px;line-height:25px;color:#59616b;">
      You've successfully created your ANAS CLI account.
    </p>

    <p style="margin:0 0 30px;font-size:15px;line-height:25px;color:#59616b;">
      You can now sign in, manage your account, and get started with ANAS CLI.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:#20252b;border-radius:6px;">
          <a href="${APP_URL}" style="display:inline-block;padding:14px 24px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
            Open ANAS CLI →
          </a>
        </td>
      </tr>
    </table>

    <div style="height:1px;background:#eceef1;margin:34px 0 24px;"></div>

    <p style="margin:0;font-size:13px;line-height:22px;color:#7b838d;">
      If you didn't create this account, please contact support.
    </p>
    `,
    "Thanks for joining ANAS CLI.",
  );

  return sendEmail(
    email,
    "Welcome to ANAS CLI",
    html,
    `Your ANAS CLI account is ready.

${name?.trim() ? `Hi ${name.trim()},\n\n` : ""}You've successfully created your ANAS CLI account.

Get started: ${APP_URL}

If you didn't create this account, please contact support.`,
  );
}
