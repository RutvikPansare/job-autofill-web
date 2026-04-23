"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Job Tracker", icon: "dashboard" },
  { href: "/shortcuts", label: "Shortcuts", icon: "bolt" },
  { href: "/profile",   label: "Profile",    icon: "person" },
  { href: "/settings",  label: "Settings",   icon: "settings" },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <div className="px-8 pt-6">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low px-5 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-lg font-black tracking-tighter text-white transition-colors hover:text-primary"
          >
            JobFill
          </Link>
          <span className="hidden text-outline-variant/50 sm:block">/</span>
          <span className="hidden text-sm font-medium text-on-surface-variant sm:block">
            Workspace
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-primary-container text-white shadow-sm"
                    : "border border-outline-variant/20 bg-surface text-on-surface-variant hover:border-primary/20 hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
