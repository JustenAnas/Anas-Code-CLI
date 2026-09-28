import { getDb } from "../lib/mongodb";

export async function ensureAuthIndexes() {
  const db = await getDb();
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true }),
    db
      .collection("sessions")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db
      .collection("passwordResetOtps")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("passwordResetOtps").createIndex({ email: 1, purpose: 1 }),
  ]);
}
