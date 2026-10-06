import { getDb } from "@/lib/mongodb";
import { normalizeEmail, otpHash, sha256 } from "@/lib/auth";
import { badRequest, json, otpSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = otpSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return badRequest("Email and 6-digit OTP are required");
  }

  const email = normalizeEmail(parsed.data.email);
  const db = await getDb();

  const record = await db.collection("pendingSignups").findOne({
    email,
    expiresAt: { $gt: new Date() },
  });

  if (!record || record.attempts >= 5) {
    return json({ error: "Invalid or expired code" }, 400);
  }

  if (record.otpHash !== otpHash(email, parsed.data.otp)) {
    await db.collection("pendingSignups").updateOne(
      { _id: record._id },
      { $inc: { attempts: 1 } },
    );

    return json({ error: "Invalid or expired code" }, 400);
  }

  // Check again in case the account was created elsewhere
  // while this verification was pending.
  if (await db.collection("users").findOne({ email })) {
    await db.collection("pendingSignups").deleteOne({
      _id: record._id,
    });

    return json(
      { error: "An account already exists. Please log in." },
      409,
    );
  }

  const result = await db.collection("users").insertOne({
    name: record.name,
    email: record.email,
    passwordHash: record.passwordHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.collection("pendingSignups").deleteOne({
    _id: record._id,
  });


  return json({
    verified: true,
    user: {
      id: result.insertedId.toString(),
      name: record.name,
      email: record.email,
    },
  });
}