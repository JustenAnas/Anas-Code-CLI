import { getDb } from "@/lib/mongodb";
import { createSession, normalizeEmail, verifyPassword } from "@/lib/auth";
import { badRequest, json, loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Email and password are required");
  const user = await (
    await getDb()
  )
    .collection("users")
    .findOne({ email: normalizeEmail(parsed.data.email) });
  if (
  !user ||
  typeof user.passwordHash !== "string" ||
  !(await verifyPassword(user.passwordHash, parsed.data.password))
) {
  return json({ error: "Invalid email or password" }, 401);
}
  await createSession(user._id.toString());
  return json({
    user: { id: user._id.toString(), name: user.name, email: user.email },
  });
}
