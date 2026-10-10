import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth is not configured." },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode");

  if (mode !== "login" && mode !== "signup") {
    return NextResponse.json(
      { error: "Invalid Google OAuth mode." },
      { status: 400 },
    );
  }

  const redirectUri = "http://localhost:3000/api/auth/google/callback";

  const state = `${mode}:${randomBytes(32).toString("hex")}`;

  const cookieStore = await cookies();

  cookieStore.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
}
