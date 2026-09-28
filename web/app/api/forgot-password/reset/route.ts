import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb";
import { hashPassword, RESET_COOKIE, sha256 } from "@/lib/auth";
import { badRequest, json, resetSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = resetSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Password must be 8–128 characters");
  const jar = await cookies();
  const raw = jar.get(RESET_COOKIE)?.value;
  if (!raw) return json({ error: "Reset verification expired" }, 401);
  const db = await getDb();
  const record = await db
    .collection("passwordResetOtps")
    .findOne({
      purpose: "password_reset",
      verified: true,
      resetTokenHash: sha256(raw),
      expiresAt: { $gt: new Date() },
    });
  if (!record) return json({ error: "Reset verification expired" }, 401);
  const user = await db.collection("users").findOne({ email: record.email });
  if (!user) return json({ error: "Reset verification expired" }, 401);
  await db
    .collection("users")
    .updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash: await hashPassword(parsed.data.password),
          updatedAt: new Date(),
        },
      },
    );
  await Promise.all([
    db.collection("sessions").deleteMany({ userId: user._id.toString() }),
    db.collection("passwordResetOtps").deleteOne({ _id: record._id }),
  ]);
  jar.delete(RESET_COOKIE);
  return json({ message: "Password reset successfully" });
}
