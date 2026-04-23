export interface Shortcut {
  id: string;
  label?: string;
  trigger: string;
  value: string;
  createdAt: number;
}

export interface ShortcutDraft {
  label: string;
  trigger: string;
  value: string;
}

export const SHORTCUTS_STORAGE_KEY = "shortcuts";
export const SHORTCUTS_ENABLED_STORAGE_KEY = "shortcuts_enabled";
