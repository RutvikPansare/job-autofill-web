"use client";

import { useState } from "react";
import type { FlatProfileField, ProfileData } from "@/types/profile";
import { useProfileStore } from "@/store/useProfile";
import ProfileSectionCard from "@/components/profile/ProfileSectionCard";

interface Props {
  profile: ProfileData;
  validationErrors: Partial<Record<FlatProfileField, string>>;
}

function Field({
  label,
  field,
  value,
  type = "text",
  placeholder,
  error,
}: {
  label: string;
  field: FlatProfileField;
  value: string;
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  const updateField = useProfileStore((state) => state.updateField);
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-on-surface">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => updateField(field, event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-surface px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-outline ${
          error
            ? "border-red-300 ring-1 ring-red-200"
            : "border-outline-variant/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
        }`}
      />
      {error ? <span className="mt-2 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export default function ProfileBasicsCard({ profile, validationErrors }: Props) {
  const addSkill = useProfileStore((state) => state.addSkill);
  const removeSkill = useProfileStore((state) => state.removeSkill);
  const [draftSkill, setDraftSkill] = useState("");

  function submitSkill() {
    addSkill(draftSkill);
    setDraftSkill("");
  }

  return (
    <ProfileSectionCard
      eyebrow="Profile"
      title="Core information"
      description="Keep your autofill identity, location, online presence, and preference fields in one clean place."
    >
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field
            label="Full Name"
            field="full_name"
            value={profile.full_name}
            placeholder="Jane Doe"
          />
          <Field
            label="First Name"
            field="first_name"
            value={profile.first_name}
            placeholder="Jane"
          />
          <Field
            label="Last Name"
            field="last_name"
            value={profile.last_name}
            placeholder="Doe"
          />
          <Field
            label="Email"
            field="email"
            type="email"
            value={profile.email}
            placeholder="jane@example.com"
            error={validationErrors.email}
          />
          <Field
            label="Phone"
            field="phone"
            value={profile.phone}
            placeholder="(555) 123-4567"
          />
          <Field
            label="Desired Salary"
            field="desired_salary"
            value={profile.desired_salary}
            placeholder="$140,000"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <Field
              label="Address"
              field="address"
              value={profile.address}
              placeholder="123 Market Street"
            />
          </div>
          <Field label="City" field="city" value={profile.city} placeholder="New York" />
          <Field label="State" field="state" value={profile.state} placeholder="NY" />
          <Field label="ZIP" field="zip" value={profile.zip} placeholder="10001" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field
            label="Country"
            field="country"
            value={profile.country}
            placeholder="United States"
          />
          <Field
            label="LinkedIn"
            field="linkedin"
            value={profile.linkedin}
            placeholder="https://linkedin.com/in/..."
            error={validationErrors.linkedin}
          />
          <Field
            label="GitHub"
            field="github"
            value={profile.github}
            placeholder="https://github.com/..."
            error={validationErrors.github}
          />
          <Field
            label="Portfolio"
            field="portfolio"
            value={profile.portfolio}
            placeholder="https://your-site.com"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field
            label="Work Authorization"
            field="work_authorization"
            value={profile.work_authorization}
            placeholder="US Citizen / Visa / Sponsorship needed"
          />
          <Field
            label="Visa Status"
            field="visa_status"
            value={profile.visa_status}
            placeholder="H-1B"
          />
          <Field
            label="Willing to Relocate"
            field="willing_to_relocate"
            value={profile.willing_to_relocate}
            placeholder="Yes / No"
          />
          <Field
            label="Engineering Focus"
            field="engineering_focus"
            value={profile.engineering_focus}
            placeholder="Frontend, Full-stack, ML..."
          />
          <Field
            label="Travel Preference"
            field="travel_preference"
            value={profile.travel_preference}
            placeholder="Remote, hybrid, on-site"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field
            label="Gender Identity"
            field="gender_identity"
            value={profile.gender_identity}
            placeholder="Optional"
          />
          <Field
            label="Pronouns"
            field="pronoun"
            value={profile.pronoun}
            placeholder="She/Her"
          />
          <Field
            label="Sexual Orientation"
            field="sexual_orientation"
            value={profile.sexual_orientation}
            placeholder="Optional"
          />
          <Field
            label="Race / Ethnicity"
            field="race_ethnicity"
            value={profile.race_ethnicity}
            placeholder="Optional"
          />
          <Field
            label="Hispanic / Latino"
            field="hispanic_latino"
            value={profile.hispanic_latino}
            placeholder="Optional"
          />
          <Field
            label="Veteran Status"
            field="veteran_status"
            value={profile.veteran_status}
            placeholder="Optional"
          />
          <Field
            label="Disability Status"
            field="disability_status"
            value={profile.disability_status}
            placeholder="Optional"
          />
        </div>

        <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-on-surface">Skills</h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Add comma-free skill tags used by the extension autofill logic.
              </p>
            </div>
            <div className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface-variant">
              {profile.skills.length} saved
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => removeSkill(skill)}
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-all hover:bg-primary/15"
              >
                {skill}
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            ))}
            {!profile.skills.length ? (
              <div className="rounded-xl border border-dashed border-outline-variant/30 px-4 py-3 text-sm text-on-surface-variant">
                No skills yet. Add a few from your resume or application focus.
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={draftSkill}
              onChange={(event) => setDraftSkill(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === ",") {
                  event.preventDefault();
                  submitSkill();
                }
              }}
              placeholder="Type a skill and press Enter"
              className="flex-1 rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={submitSkill}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm font-medium text-on-surface transition-all hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Skill
            </button>
          </div>
        </div>
      </div>
    </ProfileSectionCard>
  );
}
