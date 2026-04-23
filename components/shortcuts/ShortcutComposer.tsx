"use client";

import { useState } from "react";
import type { ShortcutDraft } from "@/types/shortcut";

interface Props {
  onSubmit: (draft: ShortcutDraft) => Promise<void>;
}

const INITIAL_DRAFT: ShortcutDraft = {
  label: "",
  trigger: "",
  value: "",
};

export default function ShortcutComposer({ onSubmit }: Props) {
  const [draft, setDraft] = useState<ShortcutDraft>(INITIAL_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSubmit(draft);
      setDraft(INITIAL_DRAFT);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not add shortcut."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-on-surface">Add New Shortcut</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Keep triggers short and memorable. Your existing extension expander will use
          these immediately.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-on-surface">
              Label
            </label>
            <input
              id="shortcutLabel"
              type="text"
              value={draft.label}
              onChange={(event) =>
                setDraft((current) => ({ ...current, label: event.target.value }))
              }
              placeholder="My home address"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-on-surface">
              Trigger
            </label>
            <input
              id="shortcutTrigger"
              type="text"
              value={draft.trigger}
              onChange={(event) =>
                setDraft((current) => ({ ...current, trigger: event.target.value }))
              }
              placeholder="/addr"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 font-mono text-sm text-on-surface outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-on-surface">
            Expansion Value
          </label>
          <textarea
            id="shortcutValue"
            value={draft.value}
            onChange={(event) =>
              setDraft((current) => ({ ...current, value: event.target.value }))
            }
            rows={4}
            placeholder="123 Main St, New York, NY 10001"
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {error ? (
          <div
            id="shortcutError"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-container/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {saving ? "progress_activity" : "add"}
            </span>
            {saving ? "Saving..." : "Add Shortcut"}
          </button>
        </div>
      </form>
    </div>
  );
}
