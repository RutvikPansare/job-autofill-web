"use client";

import type { AISettings } from "@/types/profile";
import ProfileSectionCard from "@/components/profile/ProfileSectionCard";

interface Props {
  aiSettings: AISettings;
  onUpdate: <K extends keyof AISettings>(field: K, value: AISettings[K]) => void;
}

export default function AISettingsCard({ aiSettings, onUpdate }: Props) {
  return (
    <ProfileSectionCard
      eyebrow="Settings"
      title="AI provider preferences"
      description="These settings stay aligned with the extension’s current Chrome-storage configuration."
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-[260px_1fr_1fr]">
        <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
          <div className="text-sm font-medium text-on-surface">Provider</div>
          <div className="mt-4 grid gap-2">
            {([
              ["openai", "OpenAI"],
              ["claude", "Claude"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => onUpdate("provider", value)}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  aiSettings.provider === value
                    ? "bg-primary-container text-white"
                    : "border border-outline-variant/30 bg-surface-container text-on-surface hover:bg-surface-container-high"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="block rounded-2xl border border-outline-variant/20 bg-surface p-4">
          <span className="mb-2 block text-sm font-medium text-on-surface">OpenAI API Key</span>
          <input
            type="password"
            value={aiSettings.openai_api_key}
            onChange={(event) => onUpdate("openai_api_key", event.target.value)}
            placeholder="sk-..."
            className="w-full rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
        </label>

        <label className="block rounded-2xl border border-outline-variant/20 bg-surface p-4">
          <span className="mb-2 block text-sm font-medium text-on-surface">Claude API Key</span>
          <input
            type="password"
            value={aiSettings.claude_api_key}
            onChange={(event) => onUpdate("claude_api_key", event.target.value)}
            placeholder="sk-ant-..."
            className="w-full rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
        </label>
      </div>

      <label className="mt-5 inline-flex items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface px-4 py-3 text-sm font-medium text-on-surface">
        <input
          type="checkbox"
          checked={aiSettings.prefer_cheaper_model}
          onChange={(event) => onUpdate("prefer_cheaper_model", event.target.checked)}
          className="h-4 w-4 rounded border-outline-variant/40 text-primary focus:ring-primary/40"
        />
        Prefer the cheaper model when possible
      </label>
    </ProfileSectionCard>
  );
}
