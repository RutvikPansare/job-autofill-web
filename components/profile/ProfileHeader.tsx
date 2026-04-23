"use client";

interface Props {
  completion: number;
  saving: boolean;
  userLabel: string;
  onSave: () => void;
  onClear: () => void;
}

export default function ProfileHeader({
  completion,
  saving,
  userLabel,
  onSave,
  onClear,
}: Props) {
  return (
    <section className="px-8">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-5 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
            Profile Workspace
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-on-surface">
            Keep your resume, profile, and cover letters extension-ready
          </h1>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            This hosted page writes to the same Chrome storage keys the extension already
            uses, so resume parsing, autofill, and cover-letter data stay compatible
            everywhere JobFill runs.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-on-surface">Profile completeness</span>
                <span className="font-semibold text-primary">{completion}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-surface-container-high">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-on-surface-variant">
                Based on your core autofill fields: full name, email, phone, and LinkedIn.
              </p>
            </div>

            <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant/70">
                Active Account
              </div>
              <div className="mt-2 text-sm font-medium text-on-surface">{userLabel}</div>
              <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                Changes save to Chrome storage first, so the extension sees the same profile
                immediately.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-sm font-medium text-on-surface-variant transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            Clear
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-container/85 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">
              {saving ? "progress_activity" : "save"}
            </span>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </section>
  );
}
