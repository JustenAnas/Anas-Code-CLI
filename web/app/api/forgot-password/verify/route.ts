import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb";
import { normalizeEmail, otpHash, RESET_COOKIE, sha256 } from "@/lib/auth";
import { badRequest, json, otpSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = otpSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Email and 6-digit OTP are required");
  const email = normalizeEmail(parsed.data.email);
  const db = await getDb();
  const record = await db
    .collection("passwordResetOtps")
    .findOne({
      email,
      purpose: "password_reset",
      verified: false,
      expiresAt: { $gt: new Date() },
    });
  if (!record || record.attempts >= 5)
    return json({ error: "Invalid or expired code" }, 400);
  if (record.otpHash !== otpHash(email, parsed.data.otp)) {
    await db
      .collection("passwordResetOtps")
      .updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
    return json({ error: "Invalid or expired code" }, 400);
  }
  const raw = randomBytes(32).toString("base64url");
  await db
    .collection("passwordResetOtps")
    .updateOne(
      { _id: record._id },
      {
        $set: {
          verified: true,
          resetTokenHash: sha256(raw),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      },
    );
  (await cookies()).set(RESET_COOKIE, raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/forgot-password",
    maxAge: 600,
  });
  return json({ verified: true });
}
