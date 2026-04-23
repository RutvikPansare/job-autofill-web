"use client";

import type { InlineMessage, ResumeRecord } from "@/types/profile";
import ProfileSectionCard from "@/components/profile/ProfileSectionCard";

interface Props {
  resumes: ResumeRecord[];
  resumeStatus: InlineMessage | null;
  resumeUploading: boolean;
  onUpload: (file: File) => void;
  onRemove: (id: string) => void;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** power;
  return `${value.toFixed(value >= 10 || power === 0 ? 0 : 1)} ${units[power]}`;
}

export default function ResumeSection({
  resumes,
  resumeStatus,
  resumeUploading,
  onUpload,
  onRemove,
}: Props) {
  return (
    <ProfileSectionCard
      eyebrow="Resume"
      title="Upload and parse resumes"
      description="The hosted page keeps the same Chrome-storage resume list and parsing behavior the extension already expects."
    >
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <label className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-dashed border-outline-variant/30 bg-surface p-5 transition-all hover:border-primary/35 hover:bg-surface-container">
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined">upload_file</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-on-surface">
              {resumeUploading ? "Parsing your resume..." : "Drop a PDF or DOCX resume"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Upload stays extension-compatible. Parsed details are reviewed before they are
              applied to your profile.
            </p>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
            <span className="material-symbols-outlined text-[18px]">description</span>
            Choose file
          </div>

          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.target.value = "";
            }}
          />
        </label>

        <div className="rounded-2xl border border-outline-variant/20 bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-on-surface">Saved resumes</h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Stored in Chrome storage for the extension to reuse.
              </p>
            </div>
            <div className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface-variant">
              {resumes.length}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/20 bg-surface-container px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-on-surface">
                    {resume.name}
                  </div>
                  <div className="mt-1 text-xs text-on-surface-variant">
                    {formatBytes(resume.size)}
                    {resume.keywords?.length ? ` · ${resume.keywords.length} keywords extracted` : " · no keywords yet"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(resume.id)}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium text-on-surface-variant transition-all hover:bg-red-50 hover:text-red-700"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}

            {!resumes.length ? (
              <div className="rounded-xl border border-dashed border-outline-variant/30 px-4 py-6 text-sm text-on-surface-variant">
                No resume uploaded yet.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {resumeStatus ? (
        <div
          className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
            resumeStatus.tone === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : resumeStatus.tone === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : resumeStatus.tone === "warn"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-blue-200 bg-blue-50 text-blue-700"
          }`}
        >
          {resumeStatus.message}
        </div>
      ) : null}
    </ProfileSectionCard>
  );
}
