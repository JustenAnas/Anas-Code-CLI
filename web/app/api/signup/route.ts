import { getDb } from "@/lib/mongodb";
import { hashPassword, newOtp, normalizeEmail, otpHash } from "@/lib/auth";
import { sendPasswordResetOtp } from "@/lib/mail";
import { badRequest, json, signupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return badRequest(
      "Name, valid email, and an 8–128 character password are required",
    );
  }

  const email = normalizeEmail(parsed.data.email);
  const db = await getDb();

  // Don't allow signup if the account already exists.
  if (await db.collection("users").findOne({ email })) {
    return json({ error: "An account already exists. Please log in." }, 409);
  }

  const otp = newOtp();

  // Remove any previous unfinished signup for this email.
  await db.collection("pendingSignups").deleteMany({ email });

  await db.collection("pendingSignups").insertOne({
    name: parsed.data.name,
    email,
    passwordHash: await hashPassword(parsed.data.password),
    otpHash: otpHash(email, otp),
    attempts: 0,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    createdAt: new Date(),
  });

  await sendPasswordResetOtp(email, otp);

  return json({
    message: "Verification code sent to your email.",
    verified: false,
  });
}
