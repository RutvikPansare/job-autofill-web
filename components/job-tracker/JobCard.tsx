"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Job } from "@/types/job";
import { useJobsStore } from "@/store/useJobs";

interface Props {
  job: Job;
}

export default function JobCard({ job }: Props) {
  const openModal = useJobsStore((s) => s.openModal);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: job.id });

  const style = {
    transform:  CSS.Translate.toString(transform),
    opacity:    isDragging ? 0.4 : 1,
    cursor:     isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // Only open modal on click, not at end of drag
        if (!isDragging) {
          e.stopPropagation();
          openModal(job);
        }
      }}
      className="group bg-surface-container border border-outline-variant/20 rounded-2xl p-4 select-none
                 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5
                 transition-all duration-200 active:scale-[0.98]"
    >
      {/* Role */}
      <h3 className="text-sm font-semibold text-on-surface leading-snug mb-1 line-clamp-2">
        {job.role || job.title || "Untitled"}
      </h3>

      {/* Company */}
      <p className="text-xs font-medium text-on-surface-variant mb-2">
        {job.company}
      </p>

      {/* Location (if present) */}
      {job.location && (
        <p className="text-xs text-outline flex items-center gap-1 mb-2">
          <span className="material-symbols-outlined text-[12px]">location_on</span>
          {job.location}
        </p>
      )}

      {/* Notes preview */}
      {job.notes && (
        <p className="text-xs text-outline line-clamp-2 mt-1 italic">{job.notes}</p>
      )}

      {/* Skills chips */}
      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {job.skills.slice(0, 3).map((s) => (
            <span
              key={s}
              className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-primary/10 text-primary"
            >
              {s}
            </span>
          ))}
          {job.skills.length > 3 && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-outline">
              +{job.skills.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Drag hint on hover */}
      <p className="text-[10px] text-outline/50 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        ⠿ drag to move
      </p>
    </div>
  );
}
