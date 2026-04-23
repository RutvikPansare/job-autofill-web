"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Job, ColumnDef } from "@/types/job";
import JobCard from "./JobCard";

interface Props {
  column: ColumnDef;
  jobs:   Job[];
}

export default function Column({ column, jobs }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col min-w-[280px] w-[280px] shrink-0">

      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{column.emoji}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            {column.label}
          </span>
        </div>
        <span className="text-xs font-semibold text-outline bg-surface-container-high px-2 py-0.5 rounded-full">
          {jobs.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-3 flex-1 min-h-[200px] p-3 rounded-2xl border-2 transition-all duration-150
          ${isOver
            ? "border-primary/60 bg-primary/5 shadow-inner shadow-primary/10"
            : "border-outline-variant/10 bg-surface-container-low/50"
          }`}
      >
        {jobs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-outline/40 italic select-none">
            Drop here
          </div>
        ) : (
          jobs.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </div>
    </div>
  );
}
