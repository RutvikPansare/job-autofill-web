"use client";

import { DEGREE_LEVELS, DISCIPLINES } from "@/lib/profileConstants";
import type { EducationEntry, WorkEntry } from "@/types/profile";
import ProfileSectionCard from "@/components/profile/ProfileSectionCard";

interface Props {
  education: EducationEntry[];
  work: WorkEntry[];
  onAddEducation: () => void;
  onUpdateEducation: (index: number, field: keyof EducationEntry, value: string) => void;
  onRemoveEducation: (index: number) => void;
  onAddWork: () => void;
  onUpdateWork: (index: number, field: keyof WorkEntry, value: string) => void;
  onRemoveWork: (index: number) => void;
}

export default function ProfileEntriesCard({
  education,
  work,
  onAddEducation,
  onUpdateEducation,
  onRemoveEducation,
  onAddWork,
  onUpdateWork,
  onRemoveWork,
}: Props) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ProfileSectionCard
        eyebrow="History"
        title="Education"
        description="Keep the same education entry structure the extension autofill flow already understands."
        actions={
          <button
            type="button"
            onClick={onAddEducation}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-sm font-medium text-on-surface transition-all hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Education
          </button>
        }
      >
        <div className="grid gap-4">
          {education.map((entry, index) => (
            <div key={index} className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-on-surface">
                  Education {index + 1}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveEducation(index)}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium text-on-surface-variant transition-all hover:bg-red-50 hover:text-red-700"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="School / University"
                  value={entry.school}
                  onChange={(value) => onUpdateEducation(index, "school", value)}
                />
                <SelectField
                  label="Degree Type"
                  value={entry.degree_level}
                  options={DEGREE_LEVELS}
                  onChange={(value) => onUpdateEducation(index, "degree_level", value)}
                />
                <Field
                  label="Discipline / Major"
                  value={entry.discipline}
                  placeholder="Computer Science"
                  datalistId={`discipline-${index}`}
                  datalistOptions={DISCIPLINES}
                  onChange={(value) => onUpdateEducation(index, "discipline", value)}
                />
                <Field
                  label="GPA"
                  value={entry.gpa}
                  placeholder="3.8"
                  onChange={(value) => onUpdateEducation(index, "gpa", value)}
                />
                <Field
                  label="Start Year"
                  value={entry.start_year}
                  placeholder="2020"
                  onChange={(value) => onUpdateEducation(index, "start_year", value)}
                />
                <Field
                  label="End Year"
                  value={entry.end_year}
                  placeholder="2024"
                  onChange={(value) => onUpdateEducation(index, "end_year", value)}
                />
              </div>
            </div>
          ))}
        </div>
      </ProfileSectionCard>

      <ProfileSectionCard
        eyebrow="History"
        title="Work experience"
        description="Preserve the same work entry schema used for autofill and application history."
        actions={
          <button
            type="button"
            onClick={onAddWork}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-sm font-medium text-on-surface transition-all hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Work
          </button>
        }
      >
        <div className="grid gap-4">
          {work.map((entry, index) => (
            <div key={index} className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-on-surface">Role {index + 1}</div>
                <button
                  type="button"
                  onClick={() => onRemoveWork(index)}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium text-on-surface-variant transition-all hover:bg-red-50 hover:text-red-700"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Company"
                    value={entry.company}
                    onChange={(value) => onUpdateWork(index, "company", value)}
                  />
                  <Field
                    label="Role"
                    value={entry.role}
                    onChange={(value) => onUpdateWork(index, "role", value)}
                  />
                  <Field
                    label="Start Date"
                    value={entry.start_date}
                    placeholder="Jan 2024"
                    onChange={(value) => onUpdateWork(index, "start_date", value)}
                  />
                  <Field
                    label="End Date"
                    value={entry.end_date}
                    placeholder="Present"
                    onChange={(value) => onUpdateWork(index, "end_date", value)}
                  />
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-on-surface">
                    Description
                  </span>
                  <textarea
                    value={entry.description}
                    onChange={(event) => onUpdateWork(index, "description", event.target.value)}
                    placeholder="Describe impact, scope, and key responsibilities."
                    className="min-h-[120px] w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </ProfileSectionCard>
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
  datalistId,
  datalistOptions,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  datalistId?: string;
  datalistOptions?: string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-on-surface">{label}</span>
      <input
        value={value}
        list={datalistId}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
      />
      {datalistId && datalistOptions ? (
        <datalist id={datalistId}>
          {datalistOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      ) : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-on-surface">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
      >
        <option value="">Select degree...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
