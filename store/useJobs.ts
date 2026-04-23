"use client";

import { create } from "zustand";
import { bridge } from "@/lib/bridge";
import type { Job, JobStatus } from "@/types/job";
import { VALID_STATUSES } from "@/types/job";
import {
  clearPendingGoogleSync,
  getPendingGoogleSync,
  queuePendingGoogleSync,
  redirectToGoogleAuth,
  type SaveJobApiResult,
  syncJobToGoogleSheets,
} from "@/lib/googleSheets";

const STORAGE_KEY = "tracked_jobs";

function generateId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeJob(raw: Record<string, unknown>): Job {
  const status = VALID_STATUSES.includes(raw.status as JobStatus)
    ? (raw.status as JobStatus)
    : "saved";
  return {
    id:          String(raw.id      ?? generateId()),
    company:     String(raw.company ?? ""),
    role:        String(raw.role    ?? raw.title ?? ""),
    title:       raw.title ? String(raw.title) : undefined,
    status,
    notes:       raw.notes     ? String(raw.notes)    : undefined,
    url:         raw.url       ? String(raw.url)      : undefined,
    location:    raw.location  ? String(raw.location) : undefined,
    skills:      Array.isArray(raw.skills) ? (raw.skills as string[]) : undefined,
    description: raw.description ? String(raw.description) : undefined,
    createdAt:   typeof raw.createdAt === "number" ? raw.createdAt : undefined,
    updatedAt:   typeof raw.updatedAt === "number" ? raw.updatedAt : undefined,
  };
}

// ── Store shape ───────────────────────────────────────────────────────────────

interface JobsState {
  jobs:       Job[];
  loading:    boolean;
  search:     string;
  modalOpen:  boolean;
  editingJob: Job | null;
}

interface JobsActions {
  loadJobs:       () => Promise<void>;
  addJob:         (data: Pick<Job, "company" | "role" | "status" | "notes">) => Promise<void>;
  updateJob:      (id: string, updates: Partial<Job>) => Promise<void>;
  deleteJob:      (id: string) => Promise<void>;
  moveJob:        (id: string, newStatus: JobStatus) => Promise<void>;
  retryPendingSheetSync: () => Promise<void>;
  setSearch:      (text: string) => void;
  openModal:      (job?: Job) => void;
  closeModal:     () => void;
  /** Call once in a top-level component to keep in sync with widget saves */
  subscribeToChanges: () => () => void;
}

type JobsStore = JobsState & JobsActions;

// ── Zustand store ─────────────────────────────────────────────────────────────

export const useJobsStore = create<JobsStore>((set, get) => ({
  // ── state
  jobs:       [],
  loading:    false,
  search:     "",
  modalOpen:  false,
  editingJob: null,

  // ── actions

  async loadJobs() {
    set({ loading: true });
    try {
      const result = await bridge.storageGet(STORAGE_KEY);
      const raw    = (result[STORAGE_KEY] as Record<string, unknown>[] | undefined) ?? [];
      const jobs   = raw.map(normalizeJob).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      set({ jobs, loading: false });
    } catch (err) {
      console.error("[JobsStore] loadJobs failed:", err);
      set({ loading: false });
    }
  },

  async addJob(data) {
    const now  = Date.now();
    const newJob: Job = {
      id:        generateId(),
      company:   data.company,
      role:      data.role,
      status:    data.status ?? "saved",
      notes:     data.notes,
      createdAt: now,
      updatedAt: now,
    };
    const jobs = [newJob, ...get().jobs];
    set({ jobs });
    await bridge.storageSet({ [STORAGE_KEY]: jobs });

    const result: SaveJobApiResult = await syncJobToGoogleSheets(newJob).catch((error: Error) => ({
      success: false,
      error: error.message,
    }));

    if (result.notConfigured) {
      clearPendingGoogleSync();
    } else if (result.needsAuth) {
      queuePendingGoogleSync(newJob);
      redirectToGoogleAuth("/dashboard");
    } else if (result.success) {
      clearPendingGoogleSync();
    }
  },

  async updateJob(id, updates) {
    const jobs = get().jobs.map((j) =>
      j.id === id ? { ...j, ...updates, updatedAt: Date.now() } : j
    );
    set({ jobs });
    await bridge.storageSet({ [STORAGE_KEY]: jobs });
  },

  async deleteJob(id) {
    const jobs = get().jobs.filter((j) => j.id !== id);
    set({ jobs });
    await bridge.storageSet({ [STORAGE_KEY]: jobs });
  },

  async moveJob(id, newStatus) {
    const jobs = get().jobs.map((j) =>
      j.id === id ? { ...j, status: newStatus, updatedAt: Date.now() } : j
    );
    set({ jobs });
    await bridge.storageSet({ [STORAGE_KEY]: jobs });
  },

  async retryPendingSheetSync() {
    const pendingJob = getPendingGoogleSync();
    if (!pendingJob) return;

    const result: SaveJobApiResult = await syncJobToGoogleSheets(pendingJob).catch((error: Error) => ({
      success: false,
      error: error.message,
    }));

    if (result.success) {
      clearPendingGoogleSync();
    }
  },

  setSearch(text) {
    set({ search: text });
  },

  openModal(job) {
    set({ modalOpen: true, editingJob: job ?? null });
  },

  closeModal() {
    set({ modalOpen: false, editingJob: null });
  },

  subscribeToChanges() {
    return bridge.onChanged((changes, area) => {
      if (area === "local" && changes[STORAGE_KEY]) {
        const raw  = (changes[STORAGE_KEY].newValue as Record<string, unknown>[] | undefined) ?? [];
        const jobs = raw.map(normalizeJob).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        set({ jobs });
      }
    });
  },
}));

// ── Derived selectors ─────────────────────────────────────────────────────────

export function useFilteredJobs(): Job[] {
  const { jobs, search } = useJobsStore();
  if (!search.trim()) return jobs;
  const q = search.toLowerCase();
  return jobs.filter(
    (j) =>
      j.company.toLowerCase().includes(q) ||
      j.role.toLowerCase().includes(q) ||
      (j.title ?? "").toLowerCase().includes(q)
  );
}

export function useJobsByStatus(): Record<JobStatus, Job[]> {
  const filtered = useFilteredJobs();
  const map: Record<string, Job[]> = {
    saved: [], applied: [], interviewing: [], offer: [], rejected: [],
  };
  for (const j of filtered) {
    (map[j.status] ?? (map.saved ??= [])).push(j);
  }
  return map as Record<JobStatus, Job[]>;
}
