import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587), secure: Number(process.env.SMTP_PORT) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });

export function sendPasswordResetOtp(email: string, otp: string) {
  return transporter.sendMail({ from: process.env.MAIL_FROM, to: email, subject: "Your password reset code", text: `Your ANAS CLI password reset code is ${otp}. It expires in 10 minutes. If you did not request this, ignore this email.` });
}
