import { getDb } from "@/lib/mongodb";
import { createCliToken, normalizeEmail, verifyPassword } from "@/lib/auth";
import { badRequest, json, loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return badRequest("Email and password are required");
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({
    email: normalizeEmail(parsed.data.email),
  });

  if (
    !user ||
    typeof user.passwordHash !== "string" ||
    !(await verifyPassword(user.passwordHash, parsed.data.password))
  ) {
    return json({ error: "Invalid email or password" }, 401);
  }

  const token = await createCliToken(user._id.toString());

  return json({
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
  });
}
