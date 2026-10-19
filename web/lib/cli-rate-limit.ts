
import { getDb } from "@/lib/mongodb";

const LIMIT = 30;
const WINDOW_MS = 60_000;

interface RateLimitDocument {
  _id: string;
  count: number;
  expiresAt: Date;
}

export async function checkCliRateLimit(userId: string) {
  const db = await getDb();

  const now = Date.now();
  const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS;

  const retryAfter = Math.max(
    1,
    Math.ceil((windowStart + WINDOW_MS - now) / 1000),
  );

  const result = await db
    .collection<RateLimitDocument>("cli_rate_limits")
    .findOneAndUpdate(
      {
        _id: `${userId}:${windowStart}`,
      },
      {
        $inc: { count: 1 },
        $setOnInsert: {
          expiresAt: new Date(windowStart + WINDOW_MS + 60_000),
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );

  return {
    allowed: result !== null && result.count <= LIMIT,
    retryAfter,
  };
}
