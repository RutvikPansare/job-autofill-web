"use client";

import { useState } from "react";
import type { Shortcut } from "@/types/shortcut";

interface Props {
  shortcuts: Shortcut[];
  onSave: (id: string, updates: Pick<Shortcut, "label" | "value">) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function ShortcutItem({
  shortcut,
  onSave,
  onDelete,
}: {
  shortcut: Shortcut;
  onSave: (id: string, updates: Pick<Shortcut, "label" | "value">) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [label, setLabel] = useState(shortcut.label || "");
  const [value, setValue] = useState(shortcut.value);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(shortcut.id, { label, value });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(`Delete shortcut "${shortcut.trigger}"?`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      await onDelete(shortcut.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-primary/15 bg-primary/10 px-3 py-1.5 font-mono text-sm font-semibold text-primary">
            {shortcut.trigger}
          </div>
          <div className="text-xs text-on-surface-variant">
            Created {new Date(shortcut.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/30 bg-surface px-3 py-2 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-on-surface">
            Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(event) => {
              setLabel(event.target.value);
              setDirty(true);
            }}
            className="edit-label-input w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-on-surface">
            Expansion Value
          </label>
          <textarea
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setDirty(true);
            }}
            rows={3}
            className="edit-val-input w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>
    </div>
  );
}

export default function ShortcutList({ shortcuts, onSave, onDelete }: Props) {
  if (!shortcuts.length) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-on-surface-variant">
          <span className="material-symbols-outlined text-[24px]">bolt</span>
        </div>
        <h2 className="text-lg font-semibold text-on-surface">No shortcuts yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
          Add your first shortcut to quickly reuse addresses, portfolio links, and other
          repetitive answers across application forms.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shortcuts.map((shortcut) => (
        <ShortcutItem
          key={shortcut.id}
          shortcut={shortcut}
          onSave={onSave}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
