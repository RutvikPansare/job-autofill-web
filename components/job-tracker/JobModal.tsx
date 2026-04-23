"use client";

import { useState, useEffect } from "react";
import { useJobsStore } from "@/store/useJobs";
import type { Job, JobStatus } from "@/types/job";
import { COLUMNS } from "@/types/job";

export default function JobModal() {
  const { modalOpen, editingJob, closeModal, addJob, updateJob, deleteJob } =
    useJobsStore();

  const [company, setCompany] = useState("");
  const [role,    setRole]    = useState("");
  const [status,  setStatus]  = useState<JobStatus>("saved");
  const [notes,   setNotes]   = useState("");
  const [saving,  setSaving]  = useState(false);

  // Populate fields when editing
  useEffect(() => {
    if (editingJob) {
      setCompany(editingJob.company);
      setRole(editingJob.role || editingJob.title || "");
      setStatus(editingJob.status);
      setNotes(editingJob.notes ?? "");
    } else {
      setCompany("");
      setRole("");
      setStatus("saved");
      setNotes("");
    }
  }, [editingJob, modalOpen]);

  if (!modalOpen) return null;

  const isEdit = !!editingJob;

  async function handleSave() {
    if (!company.trim() && !role.trim()) return;
    setSaving(true);
    try {
      if (isEdit && editingJob) {
        await updateJob(editingJob.id, { company, role, status, notes: notes || undefined });
      } else {
        await addJob({ company, role, status, notes: notes || undefined });
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingJob) return;
    if (!confirm("Remove this job from your tracker?")) return;
    await deleteJob(editingJob.id);
    closeModal();
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <div className="w-full max-w-lg bg-surface-container border border-outline-variant/30 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/20">
          <h2 className="text-lg font-bold text-on-surface">
            {isEdit ? "Edit Job" : "Add Job"}
          </h2>
          <button
            onClick={closeModal}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-outline hover:text-on-surface hover:bg-surface-container-high transition-all"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Extended fields (view-only when editing a widget-saved job) */}
          {editingJob?.url && (
            <a
              href={editingJob.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 truncate"
            >
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              {editingJob.url}
            </a>
          )}

          {/* Company */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Company
            </label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Role / Title
            </label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Status
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {COLUMNS.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setStatus(col.id)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-xs font-medium transition-all
                    ${status === col.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-outline-variant/20 bg-surface text-outline hover:border-outline-variant/40 hover:text-on-surface-variant"
                    }`}
                >
                  <span>{col.emoji}</span>
                  <span className="leading-none">{col.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Interview notes, contacts, anything…"
              rows={3}
              className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all resize-none"
            />
          </div>

          {/* Skills display (read-only) */}
          {editingJob?.skills && editingJob.skills.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Skills (from posting)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {editingJob.skills.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/20 bg-surface-container-low/50">
          {isEdit ? (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-error bg-error/10 border border-error/20 hover:bg-error/20 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Delete
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              onClick={closeModal}
              className="px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-high transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || (!company.trim() && !role.trim())}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-primary-container hover:bg-primary-container/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
              {isEdit ? "Save Changes" : "Add Job"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
