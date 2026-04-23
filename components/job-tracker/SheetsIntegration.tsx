"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { bridge } from "@/lib/bridge";
import { getGoogleAuthHeaders, redirectToGoogleAuth } from "@/lib/googleSheets";

const SHEETS_STORAGE_KEY = "jf_google_sheets_settings";

type SheetConfig = {
  sheetId?: string;
  sheetName?: string;
  sheetTitle?: string;
  updatedAt?: string;
};

type SheetsState = {
  byUser?: Record<string, SheetConfig>;
  pendingRows?: unknown[];
};

type SheetFile = {
  id: string;
  name: string;
};

export default function SheetsIntegration() {
  const { user } = useAuth();
  const [files, setFiles] = useState<SheetFile[]>([]);
  const [config, setConfig] = useState<SheetConfig | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [status, setStatus] = useState({
    message: "Checking Google Sheets connection...",
    tone: "info" as "info" | "success" | "warn" | "error",
  });
  const [loadingList, setLoadingList] = useState(false);
  const [creating, setCreating] = useState(false);

  const canManage = useMemo(() => Boolean(user?.id), [user?.id]);

  const loadSheetState = useCallback(async (): Promise<SheetConfig | null> => {
    if (!user?.id) {
      setConfig(null);
      return null;
    }

    const result = await bridge.storageGet(SHEETS_STORAGE_KEY);
    const state = (result[SHEETS_STORAGE_KEY] as SheetsState | undefined) || {};
    const nextConfig = state.byUser?.[user.id] || null;
    setConfig(nextConfig);
    return nextConfig;
  }, [user?.id]);

  const saveSheetState = useCallback(
    async (nextConfig: SheetConfig) => {
      if (!user?.id) throw new Error("Please sign in first.");
      const result = await bridge.storageGet(SHEETS_STORAGE_KEY);
      const state = (result[SHEETS_STORAGE_KEY] as SheetsState | undefined) || {};
      const nextState: SheetsState = {
        byUser: {
          ...(state.byUser || {}),
          [user.id]: {
            ...(state.byUser?.[user.id] || {}),
            ...nextConfig,
            updatedAt: new Date().toISOString(),
          },
        },
        pendingRows: Array.isArray(state.pendingRows) ? state.pendingRows : [],
      };
      await bridge.storageSet({ [SHEETS_STORAGE_KEY]: nextState });
      setConfig(nextState.byUser?.[user.id] || null);
    },
    [user?.id]
  );

  const refreshSheetList = useCallback(
    async (selectedId?: string | null) => {
      setLoadingList(true);
      try {
        const headers = await getGoogleAuthHeaders();
        if (!headers) {
          setFiles([]);
          setStatus({
            message: "Sign in with Google first, then choose the sheet your widget should use.",
            tone: "warn",
          });
          return;
        }

        const response = await fetch("/api/google-sheets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({ action: "LIST_SPREADSHEETS" }),
        });
        const result = (await response.json().catch(() => null)) as
          | { success?: boolean; files?: SheetFile[]; error?: string; needsAuth?: boolean }
          | null;

        if (result?.needsAuth) {
          setFiles([]);
          setStatus({
            message: "Google sign-in expired. Reconnect to load your spreadsheets.",
            tone: "warn",
          });
          return;
        }

        if (!result?.success) {
          throw new Error(String(result?.error || "Could not load spreadsheet list."));
        }

        const nextFiles = (result.files || []) as SheetFile[];
        setFiles(nextFiles);

        if (selectedId) {
          const selectedFile = nextFiles.find((file) => file.id === selectedId);
          if (selectedFile) {
            setStatus({
              message: `Widget sync is currently pointed at "${selectedFile.name}".`,
              tone: "success",
            });
            return;
          }
        }
      } finally {
        setLoadingList(false);
      }
    },
    []
  );

  const refreshPanel = useCallback(async () => {
    if (!canManage) {
      setFiles([]);
      setStatus({
        message: "Sign in with Google first, then choose the sheet your widget should use.",
        tone: "warn",
      });
      return;
    }

    const nextConfig = await loadSheetState();
    await refreshSheetList(nextConfig?.sheetId || null);

    if (!nextConfig?.sheetId) {
      setStatus({
        message: "No sheet selected yet. Create one or choose an existing spreadsheet.",
        tone: "warn",
      });
      return;
    }

    setStatus({
      message: `Widget sync is currently pointed at "${nextConfig.sheetName || "Job Applications Tracker"}".`,
      tone: "success",
    });
  }, [canManage, loadSheetState, refreshSheetList]);

  useEffect(() => {
    refreshPanel().catch((error: Error) => {
      setStatus({
        message: error.message || "Could not load Google Sheets settings.",
        tone: "error",
      });
    });

    return bridge.onChanged((changes, area) => {
      if (area !== "local") return;
      if (changes.jf_auth_session || changes[SHEETS_STORAGE_KEY]) {
        refreshPanel().catch(() => {});
      }
    });
  }, [refreshPanel]);

  async function handleConnect() {
    setStatus({ message: "Opening Google sign-in...", tone: "info" });
    redirectToGoogleAuth("/dashboard");
  }

  async function handleCreate() {
    try {
      setCreating(true);
      setStatus({ message: "Creating a new spreadsheet...", tone: "info" });
      const headers = await getGoogleAuthHeaders();
      if (!headers) {
        setStatus({
          message: "Sign in with Google first, then create a spreadsheet.",
          tone: "warn",
        });
        return;
      }

      const response = await fetch("/api/google-sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          action: "CREATE_SPREADSHEET",
          title: "Job Applications Tracker",
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            spreadsheetId?: string;
            spreadsheetName?: string;
            sheetTitle?: string;
            error?: string;
            needsAuth?: boolean;
          }
        | null;

      if (result?.needsAuth) {
        setStatus({
          message: "Google sign-in expired. Reconnect before creating a sheet.",
          tone: "warn",
        });
        return;
      }

      if (!result?.success) {
        throw new Error(String(result?.error || "Could not create spreadsheet."));
      }

      await saveSheetState({
        sheetId: result.spreadsheetId,
        sheetName: result.spreadsheetName || "Job Applications Tracker",
        sheetTitle: result.sheetTitle || "Applications",
      });
      await refreshPanel();
      setStatus({
        message: `Created and selected "${result.spreadsheetName || "Job Applications Tracker"}".`,
        tone: "success",
      });
    } catch (error) {
      setStatus({
        message:
          error instanceof Error ? error.message : "Could not create spreadsheet.",
        tone: "error",
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleSelect(sheetId: string) {
    if (!sheetId) return;
    try {
      setStatus({ message: "Selecting spreadsheet...", tone: "info" });
      const file = files.find((entry) => entry.id === sheetId);
      const headers = await getGoogleAuthHeaders();
      if (!headers) {
        setStatus({
          message: "Sign in with Google first, then choose the sheet your widget should use.",
          tone: "warn",
        });
        return;
      }

      const response = await fetch("/api/google-sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          action: "GET_HEADERS",
          sheetId,
          sheetName: file?.name || "Spreadsheet",
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            spreadsheetName?: string;
            sheetTitle?: string;
            error?: string;
            needsAuth?: boolean;
          }
        | null;

      if (result?.needsAuth) {
        setStatus({
          message: "Google sign-in expired. Reconnect before selecting a sheet.",
          tone: "warn",
        });
        return;
      }

      if (!result?.success) {
        throw new Error(String(result?.error || "Could not read spreadsheet."));
      }

      await saveSheetState({
        sheetId,
        sheetName: result.spreadsheetName || file?.name || "Spreadsheet",
        sheetTitle: result.sheetTitle || "Applications",
      });
      setStatus({
        message: `Selected "${result.spreadsheetName || file?.name || "Spreadsheet"}" for widget sync.`,
        tone: "success",
      });
    } catch (error) {
      setStatus({
        message:
          error instanceof Error ? error.message : "Could not select spreadsheet.",
        tone: "error",
      });
    }
  }

  const toneClasses = {
    info: "border-blue-200 bg-blue-50 text-blue-700",
    success: "border-green-200 bg-green-50 text-green-700",
    warn: "border-amber-200 bg-amber-50 text-amber-700",
    error: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <section className="px-8">
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
              Google Sheets
            </div>
            <h2 className="mt-1 text-lg font-semibold text-on-surface">
              Sync your tracker to your own spreadsheet
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Choose the spreadsheet your widget should always save into.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/30 bg-surface-container text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface"
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand Google Sheets settings" : "Collapse Google Sheets settings"}
          >
            <span
              className={`material-symbols-outlined text-[20px] transition-transform ${
                collapsed ? "" : "rotate-180"
              }`}
            >
              keyboard_arrow_down
            </span>
          </button>
        </div>

        {!collapsed ? (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleConnect}
                className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/30 bg-surface-container px-3 py-2 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface"
              >
                {canManage ? "Refresh Sheet List" : "Connect Google Sheets"}
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!canManage || creating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary-container px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-container/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create New Sheet"}
              </button>
            </div>

            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${toneClasses[status.tone]}`}
            >
              {status.message}
            </div>

            <div className="mt-4">
              <label
                htmlFor="tracker-sheets-select"
                className="mb-2 block text-sm font-medium text-on-surface"
              >
                Existing spreadsheet
              </label>
              <select
                id="tracker-sheets-select"
                value={config?.sheetId || ""}
                disabled={!canManage || loadingList}
                onChange={(event) => {
                  void handleSelect(event.target.value);
                }}
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
              >
                <option value="">Select an existing spreadsheet…</option>
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
