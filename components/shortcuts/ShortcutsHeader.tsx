"use client";

interface Props {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function ShortcutsHeader({ enabled, onToggle }: Props) {
  return (
    <section className="px-8">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
            Text Shortcuts
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-on-surface">
            Reusable phrases for every application
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
            Manage the same Chrome-storage shortcuts the extension expands inside job
            application forms. Changes here are reflected anywhere the extension is active.
          </p>
        </div>

        <label className="inline-flex items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface px-4 py-3 text-sm font-medium text-on-surface">
          <input
            id="shortcutsToggle"
            type="checkbox"
            checked={enabled}
            onChange={(event) => onToggle(event.target.checked)}
            className="h-4 w-4 rounded border-outline-variant/40 text-primary focus:ring-primary/40"
          />
          Enable Shortcuts
        </label>
      </div>
    </section>
  );
}
