import { getSupabaseClient } from "./supabase";
import { bridge } from "./bridge";
import type { Job } from "@/types/job";

const PENDING_SYNC_KEY = "jf_pending_google_sync_job";
const SHEET_META_KEY = "jf_google_sheet_meta";
const SHEETS_STORAGE_KEY = "jf_google_sheets_settings";

export interface SaveJobApiResult {
  success: boolean;
  needsAuth?: boolean;
  notConfigured?: boolean;
  error?: string;
  sheetId?: string;
  sheetName?: string;
  sheetTitle?: string;
  spreadsheetUrl?: string;
}

export interface GoogleSheetsApiHeaders {
  Authorization: string;
  "X-Google-Access-Token": string;
}

type SelectedSheetConfig = {
  sheetId: string;
  sheetName?: string;
  sheetTitle?: string;
};

async function getSelectedSheetConfig(): Promise<SelectedSheetConfig | null> {
  if (typeof window === "undefined") return null;

  const { data } = await getSupabaseClient().auth.getSession();
  const userId = data.session?.user?.id;
  if (!userId) return null;

  try {
    const result = await bridge.storageGet(SHEETS_STORAGE_KEY);
    const state = (result[SHEETS_STORAGE_KEY] as
      | {
          byUser?: Record<
            string,
            { sheetId?: string; sheetName?: string; sheetTitle?: string }
          >;
        }
      | undefined) || { byUser: {} };
    const config = state.byUser?.[userId];
    if (!config?.sheetId) return null;
    return {
      sheetId: config.sheetId,
      sheetName: config.sheetName || "Job Applications Tracker",
      sheetTitle: config.sheetTitle || "Applications",
    };
  } catch {
    return null;
  }
}

function persistSheetMeta(result: SaveJobApiResult) {
  if (typeof window === "undefined" || !result.sheetId) return;
  localStorage.setItem(
    SHEET_META_KEY,
    JSON.stringify({
      sheetId: result.sheetId,
      sheetName: result.sheetName || "Job Applications Tracker",
      sheetTitle: result.sheetTitle || "Applications",
      updatedAt: new Date().toISOString(),
    })
  );
}

export async function getGoogleAuthHeaders(): Promise<GoogleSheetsApiHeaders | null> {
  const { data } = await getSupabaseClient().auth.getSession();
  const session = data.session;

  if (!session?.access_token || !session?.provider_token) {
    return null;
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    "X-Google-Access-Token": session.provider_token,
  };
}

export async function syncJobToGoogleSheets(job: Job): Promise<SaveJobApiResult> {
  const selectedSheet = await getSelectedSheetConfig();
  if (!selectedSheet) {
    return { success: false, notConfigured: true };
  }

  const headers = await getGoogleAuthHeaders();
  if (!headers) {
    return { success: false, needsAuth: true };
  }

  const response = await fetch("/api/save-job", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      job,
      sheetId: selectedSheet.sheetId,
      sheetName: selectedSheet.sheetName || "Job Applications Tracker",
      sheetTitle: selectedSheet.sheetTitle || "Applications",
    }),
  });

  const result = (await response.json().catch(() => null)) as SaveJobApiResult | null;
  const normalized = result || {
    success: false,
    error: "Google Sheets sync failed.",
  };

  if (normalized.success) {
    persistSheetMeta(normalized);
  }

  return normalized;
}

export function queuePendingGoogleSync(job: Job) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(job));
}

export function clearPendingGoogleSync() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PENDING_SYNC_KEY);
}

export function getPendingGoogleSync(): Job | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PENDING_SYNC_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Job;
  } catch {
    return null;
  }
}

export function redirectToGoogleAuth(returnTo = "/dashboard") {
  if (typeof window === "undefined") return;
  const authUrl = new URL("/api/auth/google", window.location.origin);
  authUrl.searchParams.set("returnTo", returnTo);
  authUrl.searchParams.set("source", "dashboard");
  window.location.href = authUrl.toString();
}
