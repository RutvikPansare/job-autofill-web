import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function getAuthToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

async function verifyUser(accessToken: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables.");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user;
}

async function googleFetch(
  accessToken: string,
  url: string,
  init: RequestInit = {}
) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    return { needsAuth: true as const };
  }

  if (!response.ok) {
    const rawBody = await response.text().catch(() => "");
    let details = rawBody;
    if (rawBody) {
      try {
        const json = JSON.parse(rawBody);
        details = json?.error?.message || JSON.stringify(json);
      } catch {
        details = rawBody;
      }
    }
    throw new Error(details || `Google request failed (${response.status})`);
  }

  if (response.status === 204) return null;
  const rawBody = await response.text().catch(() => "");
  if (!rawBody) return null;
  return JSON.parse(rawBody);
}

function encodeSheetRange(sheetTitle: string) {
  const safeTitle = String(sheetTitle || "Sheet1").replace(/'/g, "''");
  return encodeURIComponent(`'${safeTitle}'!A:ZZ`);
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = getAuthToken(request);
    if (!accessToken) {
      return NextResponse.json({ success: false, needsAuth: true }, { status: 401 });
    }

    const user = await verifyUser(accessToken);
    if (!user) {
      return NextResponse.json({ success: false, needsAuth: true }, { status: 401 });
    }

    const googleAccessToken = request.headers.get("x-google-access-token");
    if (!googleAccessToken) {
      return NextResponse.json({ success: false, needsAuth: true }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const action = typeof body?.action === "string" ? body.action : "";

    if (action === "LIST_SPREADSHEETS") {
      const data = await googleFetch(
        googleAccessToken,
        "https://www.googleapis.com/drive/v3/files?q=" +
          encodeURIComponent(
            "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false"
          ) +
          "&fields=files(id,name)&pageSize=1000&orderBy=modifiedTime desc"
      );

      if (data && "needsAuth" in data) {
        return NextResponse.json({ success: false, needsAuth: true }, { status: 401 });
      }

      return NextResponse.json({ success: true, files: data?.files || [] });
    }

    if (action === "CREATE_SPREADSHEET") {
      const title =
        typeof body?.title === "string" && body.title ? body.title : "Job Applications Tracker";
      const data = await googleFetch(
        googleAccessToken,
        "https://sheets.googleapis.com/v4/spreadsheets",
        {
          method: "POST",
          body: JSON.stringify({
            properties: { title },
            sheets: [{ properties: { title: "Applications" } }],
          }),
        }
      );

      if (data && "needsAuth" in data) {
        return NextResponse.json({ success: false, needsAuth: true }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        spreadsheetId: data?.spreadsheetId,
        spreadsheetName: data?.properties?.title || title,
        sheetTitle: data?.sheets?.[0]?.properties?.title || "Applications",
        spreadsheetUrl: data?.spreadsheetUrl || null,
      });
    }

    if (action === "GET_HEADERS") {
      const sheetId = typeof body?.sheetId === "string" ? body.sheetId : "";
      if (!sheetId) return jsonError("Missing sheetId");

      const metadata = await googleFetch(
        googleAccessToken,
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
          sheetId
        )}?fields=properties.title,sheets.properties.title`
      );

      if (metadata && "needsAuth" in metadata) {
        return NextResponse.json({ success: false, needsAuth: true }, { status: 401 });
      }

      const sheetTitle =
        (typeof body?.sheetTitle === "string" && body.sheetTitle) ||
        metadata?.sheets?.[0]?.properties?.title ||
        "Applications";
      const range = encodeSheetRange(sheetTitle);
      const values = await googleFetch(
        googleAccessToken,
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
          sheetId
        )}/values/${range}?majorDimension=ROWS`
      );

      if (values && "needsAuth" in values) {
        return NextResponse.json({ success: false, needsAuth: true }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        spreadsheetName: metadata?.properties?.title || body?.sheetName || "Spreadsheet",
        sheetTitle,
        headers: Array.isArray(values?.values?.[0]) ? values.values[0] : [],
      });
    }

    return jsonError("Unsupported Google Sheets action.", 400);
  } catch (error) {
    console.error("[google-sheets] failed:", error);
    return jsonError(
      error instanceof Error ? error.message : "Google Sheets request failed.",
      500
    );
  }
}
