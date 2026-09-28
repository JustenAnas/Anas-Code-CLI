import { createHash, createHmac, randomBytes, randomInt } from "node:crypto";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { getDb } from "./mongodb";

export const SESSION_COOKIE = "anas_session";
export const RESET_COOKIE = "anas_reset";
const sessionDays = 30;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const otpHash = (email: string, otp: string) =>
  createHmac("sha256", process.env.SESSION_SECRET!)
    .update(`${normalizeEmail(email)}:${otp}`)
    .digest("hex");
export const newOtp = () => String(randomInt(100000, 1000000));

export async function hashPassword(password: string) {
  const argon2 = await import("argon2");
  return argon2.hash(password, { type: argon2.argon2id });
}
export async function verifyPassword(hash: string, password: string) {
  const argon2 = await import("argon2");
  return argon2.verify(hash, password);
}

export async function createSession(userId: string) {
  const raw = randomBytes(32).toString("base64url");
  const db = await getDb();
  await db.collection("sessions").insertOne({
    tokenHash: sha256(raw),
    userId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + sessionDays * 86400000),
  });
  (await cookies()).set(SESSION_COOKIE, raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionDays * 86400,
  });
}

export async function currentUser() {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const db = await getDb();
  const session = await db
    .collection("sessions")
    .findOne({ tokenHash: sha256(raw), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  if (typeof session.userId !== "string" || !ObjectId.isValid(session.userId))
    return null;
  return db
    .collection("users")
    .findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { passwordHash: 0 } },
    );
}

export async function clearSession() {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw)
    await (
      await getDb()
    )
      .collection("sessions")
      .deleteOne({ tokenHash: sha256(raw) });
  jar.delete(SESSION_COOKIE);
}
