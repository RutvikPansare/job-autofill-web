"use client";

import { create } from "zustand";
import { bridge } from "@/lib/bridge";
import {
  SHORTCUTS_ENABLED_STORAGE_KEY,
  SHORTCUTS_STORAGE_KEY,
  type Shortcut,
  type ShortcutDraft,
} from "@/types/shortcut";

interface ShortcutsState {
  shortcuts: Shortcut[];
  enabled: boolean;
  loading: boolean;
}

interface ShortcutsActions {
  loadShortcuts: () => Promise<void>;
  addShortcut: (draft: ShortcutDraft) => Promise<void>;
  updateShortcut: (id: string, updates: Pick<Shortcut, "label" | "value">) => Promise<void>;
  deleteShortcut: (id: string) => Promise<void>;
  setEnabled: (enabled: boolean) => Promise<void>;
  subscribeToChanges: () => () => void;
}

type ShortcutsStore = ShortcutsState & ShortcutsActions;

function normalizeShortcut(raw: Record<string, unknown>): Shortcut {
  return {
    id: String(raw.id ?? crypto.randomUUID()),
    label: raw.label ? String(raw.label) : "",
    trigger: String(raw.trigger ?? ""),
    value: String(raw.value ?? ""),
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : Date.now(),
  };
}

async function readShortcutState() {
  const result = await bridge.storageGet([
    SHORTCUTS_STORAGE_KEY,
    SHORTCUTS_ENABLED_STORAGE_KEY,
  ]);

  const rawShortcuts =
    (result[SHORTCUTS_STORAGE_KEY] as Record<string, unknown>[] | undefined) ?? [];

  return {
    shortcuts: rawShortcuts.map(normalizeShortcut).sort((a, b) => a.createdAt - b.createdAt),
    enabled: result[SHORTCUTS_ENABLED_STORAGE_KEY] !== false,
  };
}

export const useShortcutsStore = create<ShortcutsStore>((set) => ({
  shortcuts: [],
  enabled: true,
  loading: false,

  async loadShortcuts() {
    set({ loading: true });
    try {
      const state = await readShortcutState();
      set({ ...state, loading: false });
    } catch (error) {
      console.error("[ShortcutsStore] loadShortcuts failed:", error);
      set({ loading: false });
    }
  },

  async addShortcut(draft) {
    const label = draft.label.trim();
    const trigger = draft.trigger.trim();
    const value = draft.value.trim();

    if (!trigger || !value) {
      throw new Error("Both trigger and value are required.");
    }

    if (!trigger.startsWith("/")) {
      throw new Error("Trigger must start with a slash (for example /addr).");
    }

    const state = await readShortcutState();
    if (state.shortcuts.some((shortcut) => shortcut.trigger === trigger)) {
      throw new Error(`Shortcut with trigger "${trigger}" already exists.`);
    }

    const nextShortcut: Shortcut = {
      id: crypto.randomUUID(),
      label,
      trigger,
      value,
      createdAt: Date.now(),
    };

    const nextShortcuts = [...state.shortcuts, nextShortcut];
    await bridge.storageSet({ [SHORTCUTS_STORAGE_KEY]: nextShortcuts });
    set({ shortcuts: nextShortcuts, enabled: state.enabled });
  },

  async updateShortcut(id, updates) {
    const state = await readShortcutState();
    const nextShortcuts = state.shortcuts.map((shortcut) =>
      shortcut.id === id
        ? {
            ...shortcut,
            label: (updates.label ?? "").trim(),
            value: updates.value ?? "",
          }
        : shortcut
    );

    await bridge.storageSet({ [SHORTCUTS_STORAGE_KEY]: nextShortcuts });
    set({ shortcuts: nextShortcuts, enabled: state.enabled });
  },

  async deleteShortcut(id) {
    const state = await readShortcutState();
    const nextShortcuts = state.shortcuts.filter((shortcut) => shortcut.id !== id);
    await bridge.storageSet({ [SHORTCUTS_STORAGE_KEY]: nextShortcuts });
    set({ shortcuts: nextShortcuts, enabled: state.enabled });
  },

  async setEnabled(enabled) {
    await bridge.storageSet({ [SHORTCUTS_ENABLED_STORAGE_KEY]: enabled });
    set({ enabled });
  },

  subscribeToChanges() {
    return bridge.onChanged((changes, area) => {
      if (area !== "local") return;
      if (changes[SHORTCUTS_STORAGE_KEY] || changes[SHORTCUTS_ENABLED_STORAGE_KEY]) {
        readShortcutState()
          .then((state) => set(state))
          .catch((error) => console.error("[ShortcutsStore] change sync failed:", error));
      }
    });
  },
}));
