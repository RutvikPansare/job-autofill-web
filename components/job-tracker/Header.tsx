"use client";

import { useJobsStore } from "@/store/useJobs";
import type { Job } from "@/types/job";

const STORAGE_KEY = "tracked_jobs";

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function triggerDownload(dataStr: string, filename: string): void {
  const a = document.createElement("a");
  a.href     = dataStr;
  a.download = filename;
  a.click();
}

export default function Header() {
  const { jobs, search, setSearch, openModal, loadJobs } = useJobsStore();

  function handleExportJson() {
    triggerDownload(
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jobs, null, 2)),
      `jobfill_${today()}.json`
    );
  }

  function handleExportCsv() {
    if (!jobs.length) return;
    const cols = ["id", "company", "role", "location", "status", "url", "notes", "createdAt", "updatedAt"];
    const rows = jobs.map((j) =>
      cols.map((h) => {
        const k = h as keyof Job;
        let v: string = String(j[k] ?? "");
        if (h === "createdAt" || h === "updatedAt") {
          const ts = j[k] as number | undefined;
          v = ts ? new Date(ts).toISOString() : "";
        }
        return `"${v.replace(/"/g, '""')}"`;
      }).join(",")
    );
    triggerDownload(
      "data:text/csv;charset=utf-8," + encodeURIComponent(cols.join(",") + "\n" + rows.join("\n")),
      `jobfill_${today()}.csv`
    );
  }

  async function handleImportCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text   = await file.text();
    const lines  = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) { alert("CSV appears empty."); return; }

    const headers  = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const newJobs: Job[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => { obj[h] = (values[idx] ?? "").trim(); });
      if (!obj.company && !obj.role && !obj.url) continue;

      newJobs.push({
        id:        obj.id || `imported_${Date.now()}_${i}`,
        company:   obj.company  ?? "",
        role:      obj.role     ?? obj.title ?? "",
        status:    (obj.status as Job["status"]) ?? "saved",
        notes:     obj.notes    ?? undefined,
        url:       obj.url      ?? undefined,
        location:  obj.location ?? undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    if (!newJobs.length) { alert("No valid jobs found in CSV."); return; }

    // Merge with existing, dedup by id
    const existing  = jobs;
    const existIds  = new Set(existing.map((j) => j.id));
    const toAdd     = newJobs.filter((j) => !existIds.has(j.id));
    const merged    = [...existing, ...toAdd];

    const { bridge } = await import("@/lib/bridge");
    await bridge.storageSet({ [STORAGE_KEY]: merged });
    await loadJobs();
    alert(`Imported ${toAdd.length} new job(s).`);
    e.target.value = "";
  }

  return (
    <section className="px-8">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search role or company…"
            className="w-full bg-surface-container border border-outline-variant/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Hidden file input for CSV import */}
          <label className="cursor-pointer">
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCsv} />
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-on-surface-variant bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high hover:text-on-surface transition-all cursor-pointer">
              <span className="material-symbols-outlined text-[16px]">upload</span>
              Import
            </span>
          </label>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-on-surface-variant bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high hover:text-on-surface transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export CSV
          </button>

          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-on-surface-variant bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high hover:text-on-surface transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">data_object</span>
            JSON
          </button>

          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-primary-container hover:bg-primary-container/80 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Job
          </button>
        </div>
      </div>
    </section>
  );
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "", inQ = false;
  for (const ch of line) {
    if (ch === '"')       inQ = !inQ;
    else if (ch === "," && !inQ) { result.push(cur); cur = ""; }
    else                  cur += ch;
  }
  result.push(cur);
  return result;
}
