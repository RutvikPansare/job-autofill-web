"use client";

import { useMemo, useState } from "react";
import type { ParsedResume, ResumePreviewState } from "@/types/profile";

interface Props {
  preview: ResumePreviewState | null;
  onClose: () => void;
  onApply: (parsed: ParsedResume) => void;
}

export default function ResumePreviewModal({ preview, onClose, onApply }: Props) {
  const [draft, setDraft] = useState<ParsedResume | null>(null);

  const activeDraft = useMemo(() => {
    if (!preview) return null;
    return draft ?? preview.parsed;
  }, [draft, preview]);

  if (!preview || !activeDraft) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-3xl border border-outline-variant/20 bg-surface p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
              Resume Preview
            </div>
            <h2 className="mt-1 text-2xl font-semibold text-on-surface">
              Review extracted details from {preview.fileName}
            </h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Make quick edits here before the parsed fields are merged into your hosted
              profile and saved back to Chrome storage.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDraft(null);
              onClose();
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container text-on-surface-variant transition-all hover:text-on-surface"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <PreviewCard title="Personal Info">
            {([
              ["full_name", "Full Name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["linkedin", "LinkedIn"],
              ["github", "GitHub"],
            ] as const).map(([field, label]) => (
              <label key={field} className="block">
                <span className="mb-2 block text-sm font-medium text-on-surface">{label}</span>
                <input
                  value={activeDraft.personal[field] ?? ""}
                  onChange={(event) =>
                    setDraft({
                      ...activeDraft,
                      personal: { ...activeDraft.personal, [field]: event.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
              </label>
            ))}
          </PreviewCard>

          <PreviewCard title="Skills">
            <div className="max-h-72 overflow-y-auto rounded-2xl border border-outline-variant/20 bg-surface px-4 py-4">
              <div className="flex flex-wrap items-start gap-2">
              {activeDraft.skills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  <input
                    value={skill}
                    onChange={(event) =>
                      setDraft({
                        ...activeDraft,
                        skills: activeDraft.skills.map((entry, entryIndex) =>
                          entryIndex === index ? event.target.value : entry
                        ),
                      })
                    }
                    className="min-w-0 flex-1 truncate bg-transparent text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...activeDraft,
                        skills: activeDraft.skills.filter((_, entryIndex) => entryIndex !== index),
                      })
                    }
                    className="shrink-0 text-primary/70 transition-colors hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </span>
              ))}
              </div>
              {!activeDraft.skills.length ? (
                <div className="rounded-xl border border-dashed border-outline-variant/30 px-4 py-3 text-sm text-on-surface-variant">
                  No skills detected.
                </div>
              ) : null}
            </div>
          </PreviewCard>

          <PreviewListCard
            title="Education"
            emptyLabel="No education entries detected."
            entries={activeDraft.education}
            renderEntry={(entry, index) => (
              <div className="grid gap-3 md:grid-cols-2">
                {([
                  ["school", "School"],
                  ["degree_level", "Degree Type"],
                  ["discipline", "Discipline"],
                  ["start_year", "Start Year"],
                  ["end_year", "End Year"],
                  ["gpa", "GPA"],
                ] as const).map(([field, label]) => (
                  <label key={field} className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant/70">
                      {label}
                    </span>
                    <input
                      value={entry[field] ?? ""}
                      onChange={(event) =>
                        setDraft({
                          ...activeDraft,
                          education: activeDraft.education.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, [field]: event.target.value } : item
                          ),
                        })
                      }
                      className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    />
                  </label>
                ))}
              </div>
            )}
            onRemove={(index) =>
              setDraft({
                ...activeDraft,
                education: activeDraft.education.filter((_, itemIndex) => itemIndex !== index),
              })
            }
          />

          <PreviewListCard
            title="Work Experience"
            emptyLabel="No work experience entries detected."
            entries={activeDraft.work_experience}
            renderEntry={(entry, index) => (
              <div className="grid gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  {([
                    ["company", "Company"],
                    ["role", "Role"],
                    ["start_date", "Start Date"],
                    ["end_date", "End Date"],
                  ] as const).map(([field, label]) => (
                    <label key={field} className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant/70">
                        {label}
                      </span>
                      <input
                        value={entry[field] ?? ""}
                        onChange={(event) =>
                          setDraft({
                            ...activeDraft,
                            work_experience: activeDraft.work_experience.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, [field]: event.target.value } : item
                            ),
                          })
                        }
                        className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                      />
                    </label>
                  ))}
                </div>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant/70">
                    Description
                  </span>
                  <textarea
                    value={entry.description ?? ""}
                    onChange={(event) =>
                      setDraft({
                        ...activeDraft,
                        work_experience: activeDraft.work_experience.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, description: event.target.value } : item
                        ),
                      })
                    }
                    className="min-h-[120px] w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  />
                </label>
              </div>
            )}
            onRemove={(index) =>
              setDraft({
                ...activeDraft,
                work_experience: activeDraft.work_experience.filter((_, itemIndex) => itemIndex !== index),
              })
            }
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setDraft(null);
              onClose();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-sm font-medium text-on-surface-variant transition-all hover:bg-surface-container-high"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(activeDraft);
              setDraft(null);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-container/85"
          >
            Apply Parsed Details
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
      <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
      <div className="mt-4 grid gap-3">{children}</div>
    </div>
  );
}

function PreviewListCard<T>({
  title,
  entries,
  emptyLabel,
  renderEntry,
  onRemove,
}: {
  title: string;
  entries: T[];
  emptyLabel: string;
  renderEntry: (entry: T, index: number) => React.ReactNode;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
      <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
      <div className="mt-4 grid gap-4">
        {entries.map((entry, index) => (
          <div key={index} className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-on-surface">
                {title} {index + 1}
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium text-on-surface-variant transition-all hover:bg-red-50 hover:text-red-700"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
            {renderEntry(entry, index)}
          </div>
        ))}
        {!entries.length ? (
          <div className="rounded-xl border border-dashed border-outline-variant/30 px-4 py-6 text-sm text-on-surface-variant">
            {emptyLabel}
          </div>
        ) : null}
      </div>
    </div>
  );
}
