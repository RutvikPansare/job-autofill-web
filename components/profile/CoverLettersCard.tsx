"use client";

import type { CoverLetterRecord } from "@/types/profile";
import ProfileSectionCard from "@/components/profile/ProfileSectionCard";

interface Props {
  coverLetters: CoverLetterRecord[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof CoverLetterRecord, value: string) => void;
  onRemove: (id: string) => void;
}

export default function CoverLettersCard({
  coverLetters,
  onAdd,
  onUpdate,
  onRemove,
}: Props) {
  return (
    <ProfileSectionCard
      eyebrow="Content"
      title="Cover letters"
      description="These templates stay in the same Chrome storage key the extension already uses for cover-letter autofill."
      actions={
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-sm font-medium text-on-surface transition-all hover:bg-surface-container-high"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Cover Letter
        </button>
      }
    >
      <div className="grid gap-4">
        {coverLetters.map((letter, index) => (
          <div key={letter.id} className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-on-surface">
                Cover Letter {index + 1}
              </div>
              <button
                type="button"
                onClick={() => onRemove(letter.id)}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium text-on-surface-variant transition-all hover:bg-red-50 hover:text-red-700"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>

            <div className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-on-surface">Name</span>
                <input
                  value={letter.name}
                  onChange={(event) => onUpdate(letter.id, "name", event.target.value)}
                  placeholder="Generic, Company X, Frontend..."
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-on-surface">Content</span>
                <textarea
                  value={letter.content}
                  onChange={(event) => onUpdate(letter.id, "content", event.target.value)}
                  placeholder="Paste your cover letter here. The extension can reuse it for longer answer fields."
                  className="min-h-[180px] w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
              </label>
            </div>
          </div>
        ))}

        {!coverLetters.length ? (
          <div className="rounded-xl border border-dashed border-outline-variant/30 px-4 py-6 text-sm text-on-surface-variant">
            No cover letters yet. Add one to keep your extension autofill content in sync.
          </div>
        ) : null}
      </div>
    </ProfileSectionCard>
  );
}
