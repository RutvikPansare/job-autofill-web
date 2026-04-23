// ── Job data model ─────────────────────────────────────────────────────────────

export type JobStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected";

export interface Job {
  id:          string;
  company:     string;
  role:        string;   // canonical; `title` kept for back-compat with widget saves
  title?:      string;   // legacy alias (populated by extension widget)
  status:      JobStatus;
  notes?:      string;
  // Extended fields saved by the extension widget
  url?:        string;
  location?:   string;
  skills?:     string[];
  description?: string;
  createdAt?:  number;
  updatedAt?:  number;
}

export interface ColumnDef {
  id:    JobStatus;
  label: string;
  emoji: string;
}

export const COLUMNS: ColumnDef[] = [
  { id: "saved",        label: "Saved",        emoji: "📌" },
  { id: "applied",      label: "Applied",      emoji: "📤" },
  { id: "interviewing", label: "Interviewing", emoji: "💬" },
  { id: "offer",        label: "Offer",        emoji: "🎉" },
  { id: "rejected",     label: "Rejected",     emoji: "❌" },
];

export const VALID_STATUSES = COLUMNS.map((c) => c.id) as JobStatus[];

// ── Google Sheets types ────────────────────────────────────────────────────────

export const SHEETS_FIELDS: { key: string; label: string }[] = [
  { key: "company",      label: "Company"      },
  { key: "role",         label: "Role"         },
  { key: "job_url",      label: "Job URL"      },
  { key: "location",     label: "Location"     },
  { key: "date_applied", label: "Date Applied" },
  { key: "status",       label: "Status"       },
  { key: "notes",        label: "Notes"        },
];

export interface SheetsConfig {
  sheetId:    string;
  sheetName:  string;
  sheetTitle: string;
  headers:    string[];
  mappings:   Record<string, string>;
  updatedAt?: string;
}

export interface SheetsStorageState {
  byUser:      Record<string, SheetsConfig>;
  pendingRows: unknown[];
}

export type StatusTone = "info" | "success" | "warn" | "error";
