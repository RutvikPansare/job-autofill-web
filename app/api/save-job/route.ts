import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const SHEET_HEADERS = [
  "Company",
  "Role",
  "Job URL",
  "Location",
  "Date Applied",
  "Status",
  "Notes",
];

function buildCorsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Google-Access-Token",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function jsonError(request: NextRequest, message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status, headers: buildCorsHeaders(request) }
  );
}

function buildRow(job: Record<string, unknown>) {
  const appliedAt =
    typeof job.date_applied === "string" && job.date_applied
      ? job.date_applied
      : new Date().toISOString();

  return [
    String(job.company ?? ""),
    String(job.role ?? job.title ?? ""),
    String(job.job_url ?? job.url ?? ""),
    String(job.location ?? ""),
    appliedAt,
    String(job.status ?? "saved"),
    String(job.notes ?? ""),
  ];
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

async function ensureSheet(
  googleAccessToken: string,
  requestedSheetId: string | null,
  requestedSheetTitle: string | null,
  requestedSheetName: string | null,
  userLabel: string
) {
  if (requestedSheetId) {
    console.info("[save-job] Reusing existing sheet", {
      requestedSheetId,
      requestedSheetTitle,
      requestedSheetName,
      userLabel,
    });
    return {
      sheetId: requestedSheetId,
      sheetTitle: requestedSheetTitle || "Applications",
      sheetName: requestedSheetName || "Job Applications Tracker",
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${requestedSheetId}/edit`,
      created: false,
    };
  }

  const created = await googleFetch(
    googleAccessToken,
    "https://sheets.googleapis.com/v4/spreadsheets",
    {
      method: "POST",
      body: JSON.stringify({
        properties: {
          title: `${userLabel} Job Applications Tracker`,
        },
        sheets: [{ properties: { title: "Applications" } }],
      }),
    }
  );

  if (created && "needsAuth" in created) return created;

  const spreadsheetId = created?.spreadsheetId;
  const sheetTitle = created?.sheets?.[0]?.properties?.title || "Applications";
  const sheetName =
    created?.properties?.title || `${userLabel} Job Applications Tracker`;
  const spreadsheetUrl = created?.spreadsheetUrl || null;

  if (!spreadsheetId) {
    throw new Error("Google Sheets did not return a spreadsheetId.");
  }

  console.info("[save-job] Created new spreadsheet", {
    spreadsheetId,
    sheetTitle,
    sheetName,
    spreadsheetUrl,
  });

  const range = encodeURIComponent(`'${sheetTitle.replace(/'/g, "''")}'!A1:G1`);
  const headerAppend = await googleFetch(
    googleAccessToken,
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      body: JSON.stringify({
        majorDimension: "ROWS",
        values: [SHEET_HEADERS],
      }),
    }
  );

  if (headerAppend && "needsAuth" in headerAppend) return headerAppend;

  return {
    sheetId: spreadsheetId,
    sheetTitle,
    sheetName,
    spreadsheetUrl,
    created: true,
  };
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = getAuthToken(request);
    if (!accessToken) {
      return NextResponse.json(
        { success: false, needsAuth: true },
        { status: 401, headers: buildCorsHeaders(request) }
      );
    }

    const user = await verifyUser(accessToken);
    if (!user) {
      return NextResponse.json(
        { success: false, needsAuth: true },
        { status: 401, headers: buildCorsHeaders(request) }
      );
    }

    const googleAccessToken = request.headers.get("x-google-access-token");
    if (!googleAccessToken) {
      return NextResponse.json(
        { success: false, needsAuth: true },
        { status: 401, headers: buildCorsHeaders(request) }
      );
    }

    const body = await request.json().catch(() => null);
    const job = body?.job;
    const requestedSheetId =
      typeof body?.sheetId === "string" && body.sheetId ? body.sheetId : null;
    const requestedSheetTitle =
      typeof body?.sheetTitle === "string" && body.sheetTitle ? body.sheetTitle : null;
    const requestedSheetName =
      typeof body?.sheetName === "string" && body.sheetName ? body.sheetName : null;

    console.info("[save-job] Incoming request", {
      origin: request.headers.get("origin"),
      requestedSheetId,
      requestedSheetTitle,
      requestedSheetName,
      hasJob: Boolean(job),
    });

    if (!job || typeof job !== "object") {
      return jsonError(request, "Missing job payload.");
    }

    console.info("[save-job] Job payload summary", {
      company: String(job.company ?? ""),
      role: String(job.role ?? job.title ?? ""),
      url: String(job.job_url ?? job.url ?? ""),
      status: String(job.status ?? "saved"),
    });

    const userLabel = user.email || user.user_metadata?.full_name || "JobFill";
    const sheet = await ensureSheet(
      googleAccessToken,
      requestedSheetId,
      requestedSheetTitle,
      requestedSheetName,
      userLabel
    );
    if (sheet && "needsAuth" in sheet) {
      return NextResponse.json(
        { success: false, needsAuth: true },
        { status: 401, headers: buildCorsHeaders(request) }
      );
    }

    const range = encodeURIComponent(
      `'${sheet.sheetTitle.replace(/'/g, "''")}'!A:G`
    );
    const appendResponse = await googleFetch(
      googleAccessToken,
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        sheet.sheetId
      )}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        body: JSON.stringify({
          majorDimension: "ROWS",
          values: [buildRow(job)],
        }),
      }
    );

    if (appendResponse && "needsAuth" in appendResponse) {
      return NextResponse.json(
        { success: false, needsAuth: true },
        { status: 401, headers: buildCorsHeaders(request) }
      );
    }

    console.info("[save-job] Append succeeded", {
      sheetId: sheet.sheetId,
      sheetName: sheet.sheetName,
      sheetTitle: sheet.sheetTitle,
      spreadsheetUrl:
        sheet.spreadsheetUrl ||
        `https://docs.google.com/spreadsheets/d/${sheet.sheetId}/edit`,
      updates: appendResponse?.updates || null,
      updatedRange: appendResponse?.updates?.updatedRange || null,
      updatedRows: appendResponse?.updates?.updatedRows || null,
    });

    return NextResponse.json(
      {
        success: true,
        sheetId: sheet.sheetId,
        sheetName: sheet.sheetName,
        sheetTitle: sheet.sheetTitle,
        spreadsheetUrl:
          sheet.spreadsheetUrl ||
          `https://docs.google.com/spreadsheets/d/${sheet.sheetId}/edit`,
        createdSheet: sheet.created,
      },
      { headers: buildCorsHeaders(request) }
    );
  } catch (error) {
    console.error("[save-job] failed:", error);
    return jsonError(
      request,
      error instanceof Error ? error.message : "Unable to save job to Google Sheets.",
      500
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request),
  });
}
