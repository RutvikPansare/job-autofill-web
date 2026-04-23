"use client";

import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function ProfileSectionCard({
  eyebrow,
  title,
  description,
  actions,
  children,
}: Props) {
  return (
    <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow ? (
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="mt-1 text-xl font-semibold text-on-surface">{title}</h2>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
