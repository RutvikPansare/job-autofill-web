"use client";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { COLUMNS } from "@/types/job";
import type { JobStatus } from "@/types/job";
import { useJobsStore, useJobsByStatus } from "@/store/useJobs";
import Column from "./Column";

export default function JobBoard() {
  const moveJob    = useJobsStore((s) => s.moveJob);
  const jobsByStatus = useJobsByStatus();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const jobId     = String(active.id);
    const newStatus = String(over.id) as JobStatus;

    // Find the current status of the dragged job
    const allJobs = Object.values(jobsByStatus).flat();
    const job = allJobs.find((j) => j.id === jobId);
    if (!job || job.status === newStatus) return;

    moveJob(jobId, newStatus);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <section className="px-8">
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => (
              <Column
                key={col.id}
                column={col}
                jobs={jobsByStatus[col.id] ?? []}
              />
            ))}
          </div>
        </div>
      </section>
    </DndContext>
  );
}
