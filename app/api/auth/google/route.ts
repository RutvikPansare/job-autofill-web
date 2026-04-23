import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function GET(request: NextRequest) {
  if (!SUPABASE_URL) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL." },
      { status: 500 }
    );
  }

  const redirectTo = new URL("/", request.url);
  redirectTo.searchParams.set("auth_callback", "1");
  redirectTo.searchParams.set(
    "returnTo",
    request.nextUrl.searchParams.get("returnTo") || "/dashboard"
  );
  redirectTo.searchParams.set(
    "source",
    request.nextUrl.searchParams.get("source") || "app"
  );

  const authUrl = new URL("/auth/v1/authorize", SUPABASE_URL);
  authUrl.searchParams.set("provider", "google");
  authUrl.searchParams.set("redirect_to", redirectTo.toString());
  authUrl.searchParams.set(
    "scopes",
    [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ].join(" ")
  );
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("access_type", "offline");

  return NextResponse.redirect(authUrl);
}
