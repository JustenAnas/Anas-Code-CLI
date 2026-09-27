import { currentUser } from "@/lib/auth";
import { json } from "@/lib/validation";

export async function GET() {
  const user = await currentUser();
  return user ? json({ user: { id: user._id.toString(), name: user.name, email: user.email } }) : json({ user: null }, 401);
}
