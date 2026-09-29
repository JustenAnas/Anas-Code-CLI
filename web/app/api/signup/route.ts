import { getDb } from "@/lib/mongodb";
import { createSession, hashPassword, normalizeEmail } from "@/lib/auth";
import { badRequest, json, signupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return badRequest(
      "Name, valid email, and an 8–128 character password are required",
    );
  const email = normalizeEmail(parsed.data.email);
  const db = await getDb();
  if (await db.collection("users").findOne({ email }))
    return json({ error: "Email or password is invalid" }, 409);
  const result = await db.collection("users").insertOne({
    name: parsed.data.name,
    email,
    passwordHash: await hashPassword(parsed.data.password),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await createSession(result.insertedId.toString());
  return json(
    {
      user: { id: result.insertedId.toString(), name: parsed.data.name, email },
    },
    201,
  );
}
