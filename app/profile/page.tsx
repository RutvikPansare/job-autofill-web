"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import AppNav from "@/components/app/AppNav";
import AISettingsCard from "@/components/profile/AISettingsCard";
import CoverLettersCard from "@/components/profile/CoverLettersCard";
import ProfileBasicsCard from "@/components/profile/ProfileBasicsCard";
import ProfileEntriesCard from "@/components/profile/ProfileEntriesCard";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ResumePreviewModal from "@/components/profile/ResumePreviewModal";
import ResumeSection from "@/components/profile/ResumeSection";
import { getSupabaseClient } from "@/lib/supabase";
import { getProfileCompletion, useProfileStore } from "@/store/useProfile";

export default function ProfilePage() {
  const {
    profile,
    resumes,
    coverLetters,
    aiSettings,
    loading,
    saving,
    resumeUploading,
    feedback,
    resumeStatus,
    validationErrors,
    resumePreview,
    loadProfile,
    saveProfile,
    clearProfile,
    subscribeToChanges,
    uploadResume,
    removeResume,
    applyResumePreview,
    closeResumePreview,
    addEducation,
    updateEducation,
    removeEducation,
    addWork,
    updateWork,
    removeWork,
    addCoverLetter,
    updateCoverLetter,
    removeCoverLetter,
    updateAISettings,
  } = useProfileStore();
  const [userLabel, setUserLabel] = useState("Extension user");

  useEffect(() => {
    loadProfile();
    const unsubscribe = subscribeToChanges();
    return () => unsubscribe();
  }, [loadProfile, subscribeToChanges]);

  useEffect(() => {
    getSupabaseClient().auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email;
      const name = data.session?.user?.user_metadata?.full_name as string | undefined;
      setUserLabel(name || email || "Extension user");
    }).catch(() => {});
  }, []);

  const completion = getProfileCompletion(profile);

  return (
    <div className="min-h-screen bg-surface">
      <Script src="/pdf.min.js" strategy="beforeInteractive" />
      <AppNav />

      <main className="flex flex-col gap-6 py-6 pb-10">
        <ProfileHeader
          completion={completion}
          saving={saving}
          userLabel={userLabel}
          onSave={() => { saveProfile().catch(() => {}); }}
          onClear={() => {
            if (window.confirm("Clear your entire profile? This cannot be undone.")) {
              clearProfile().catch(() => {});
            }
          }}
        />

        {feedback ? (
          <section className="px-8">
            <div
              className={`mx-auto max-w-screen-2xl rounded-xl border px-4 py-3 text-sm ${
                feedback.tone === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : feedback.tone === "warn"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {feedback.message}
            </div>
          </section>
        ) : null}

        <section className="px-8">
          <div className="mx-auto grid max-w-screen-2xl gap-6">
            <ResumeSection
              resumes={resumes}
              resumeStatus={resumeStatus}
              resumeUploading={resumeUploading}
              onUpload={(file) => { uploadResume(file).catch(() => {}); }}
              onRemove={(id) => { removeResume(id).catch(() => {}); }}
            />

            <ProfileBasicsCard
              profile={profile}
              validationErrors={validationErrors}
            />

            <ProfileEntriesCard
              education={profile.education}
              work={profile.work_experience}
              onAddEducation={addEducation}
              onUpdateEducation={updateEducation}
              onRemoveEducation={removeEducation}
              onAddWork={addWork}
              onUpdateWork={updateWork}
              onRemoveWork={removeWork}
            />

            <CoverLettersCard
              coverLetters={coverLetters}
              onAdd={addCoverLetter}
              onUpdate={updateCoverLetter}
              onRemove={removeCoverLetter}
            />

            <AISettingsCard
              aiSettings={aiSettings}
              onUpdate={updateAISettings}
            />
          </div>
        </section>

        {loading ? (
          <section className="px-8">
            <div className="mx-auto max-w-screen-2xl rounded-2xl border border-outline-variant/20 bg-surface-container-low px-5 py-4 text-sm text-on-surface-variant">
              Loading profile data...
            </div>
          </section>
        ) : null}
      </main>

      <ResumePreviewModal
        preview={resumePreview}
        onClose={closeResumePreview}
        onApply={(parsed) => { applyResumePreview(parsed).catch(() => {}); }}
      />
    </div>
  );
}
