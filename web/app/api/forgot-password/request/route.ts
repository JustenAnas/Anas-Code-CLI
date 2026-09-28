import { getDb } from "@/lib/mongodb";
import { newOtp, normalizeEmail, otpHash } from "@/lib/auth";
import { sendPasswordResetOtp } from "@/lib/mail";
import { badRequest, emailSchema, json } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = emailSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("A valid email is required");
  const email = normalizeEmail(parsed.data.email);
  const db = await getDb();
  const user = await db
    .collection("users")
    .findOne({ email }, { projection: { _id: 1 } });
  if (user) {
    const otp = newOtp();
    await db
      .collection("passwordResetOtps")
      .deleteMany({ email, purpose: "password_reset" });
    await db
      .collection("passwordResetOtps")
      .insertOne({
        email,
        purpose: "password_reset",
        otpHash: otpHash(email, otp),
        attempts: 0,
        verified: false,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        createdAt: new Date(),
      });
    await sendPasswordResetOtp(email, otp);
  }
  return json({ message: "If an account exists, a reset code has been sent." });
}
