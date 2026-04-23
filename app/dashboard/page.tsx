"use client";

import { useEffect } from "react";
import AppNav from "@/components/app/AppNav";
import { useJobsStore } from "@/store/useJobs";
import Header from "@/components/job-tracker/Header";
import SheetsIntegration from "@/components/job-tracker/SheetsIntegration";
import JobBoard from "@/components/job-tracker/JobBoard";
import JobModal from "@/components/job-tracker/JobModal";

export default function DashboardPage() {
  const loadJobs          = useJobsStore((s) => s.loadJobs);
  const subscribeToChanges = useJobsStore((s) => s.subscribeToChanges);
  const retryPendingSheetSync = useJobsStore((s) => s.retryPendingSheetSync);

  useEffect(() => {
    // loadJobs() calls bridge.storageGet(), which internally waits for the
    // extension content-script bridge before falling back to localStorage.
    loadJobs();
    retryPendingSheetSync().catch(() => {});
    const unsubscribe = subscribeToChanges();
    return () => { unsubscribe(); };
  }, [loadJobs, retryPendingSheetSync, subscribeToChanges]);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <AppNav />

      <main className="flex-1 flex flex-col gap-6 py-6 overflow-hidden">
        <SheetsIntegration />
        <Header />
        {/* Kanban board */}
        <JobBoard />
      </main>

      {/* Job add / edit modal */}
      <JobModal />
    </div>
  );
}
