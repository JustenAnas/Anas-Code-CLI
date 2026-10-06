import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb";
import { createSession, normalizeEmail } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    return NextResponse.json(
      { error: "Google authorization code is missing." },
      { status: 400 },
    );
  }

  if (!state) {
    return NextResponse.json(
      { error: "Google OAuth state is missing." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("google_oauth_state")?.value;

  cookieStore.delete("google_oauth_state");

  if (!savedState || savedState !== state) {
    return NextResponse.json(
      { error: "Invalid Google OAuth state." },
      { status: 400 },
    );
  }

  const [mode] = state.split(":");

  if (mode !== "login" && mode !== "signup") {
    return NextResponse.json(
      { error: "Invalid Google OAuth mode." },
      { status: 400 },
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Google OAuth is not configured." },
      { status: 500 },
    );
  }

  const redirectUri =
    "http://localhost:3000/api/auth/google/callback";

  try {
    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      },
    );

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: "Failed to authenticate with Google." },
        { status: 401 },
      );
    }

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      return NextResponse.json(
        { error: "Google did not return an access token." },
        { status: 401 },
      );
    }

    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      },
    );

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Failed to get Google user information." },
        { status: 401 },
      );
    }

    const googleUser = await userResponse.json();

    if (!googleUser.sub || !googleUser.email) {
      return NextResponse.json(
        { error: "Google account information is incomplete." },
        { status: 400 },
      );
    }

    const email = normalizeEmail(googleUser.email);
    const db = await getDb();
    const users = db.collection("users");

    let user = await users.findOne({
      provider: "google",
      providerId: googleUser.sub,
    });

    if (mode === "login") {
      if (!user) {
        user = await users.findOne({ email });
      }

      if (!user) {
        return NextResponse.redirect(
          new URL(
            "/login?error=Account%20not%20found.%20Please%20sign%20up%20first.",
            request.url,
          ),
        );
      }
    }

    if (mode === "signup") {
      if (user) {
        return NextResponse.redirect(
          new URL(
            "/login?error=An%20account%20already%20exists.%20Please%20log%20in.",
            request.url,
          ),
        );
      }

      const existingEmailUser = await users.findOne({ email });

      if (existingEmailUser) {
        return NextResponse.redirect(
          new URL(
            "/login?error=An%20account%20already%20exists%20with%20this%20email.%20Please%20log%20in.",
            request.url,
          ),
        );
      }

      const result = await users.insertOne({
        name: googleUser.name || email.split("@")[0],
        email,
        provider: "google",
        providerId: googleUser.sub,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      user = await users.findOne({
        _id: result.insertedId,
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unable to create or find your ANAS account." },
        { status: 500 },
      );
    }

    await createSession(user._id.toString());

    return NextResponse.redirect(new URL("/", request.url));
  } catch {
    return NextResponse.json(
      { error: "Google authentication failed." },
      { status: 500 },
    );
  }
}