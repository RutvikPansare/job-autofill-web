"use client";

import { useEffect, useState } from "react";
import AppNav from "@/components/app/AppNav";
import ShortcutComposer from "@/components/shortcuts/ShortcutComposer";
import ShortcutsHeader from "@/components/shortcuts/ShortcutsHeader";
import ShortcutList from "@/components/shortcuts/ShortcutList";
import ShortcutSandbox from "@/components/shortcuts/ShortcutSandbox";
import { useShortcutsStore } from "@/store/useShortcuts";

export default function ShortcutsPage() {
  const {
    shortcuts,
    enabled,
    loading,
    loadShortcuts,
    addShortcut,
    updateShortcut,
    deleteShortcut,
    setEnabled,
    subscribeToChanges,
  } = useShortcutsStore();
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    loadShortcuts();
    const unsubscribe = subscribeToChanges();
    return () => unsubscribe();
  }, [loadShortcuts, subscribeToChanges]);

  async function handleAddShortcut(draft: {
    label: string;
    trigger: string;
    value: string;
  }) {
    await addShortcut(draft);
    setFeedback({ tone: "success", message: "Shortcut added." });
  }

  async function handleSaveShortcut(
    id: string,
    updates: { label?: string; value?: string }
  ) {
    await updateShortcut(id, {
      label: updates.label || "",
      value: updates.value || "",
    });
    setFeedback({ tone: "success", message: "Shortcut updated." });
  }

  async function handleDeleteShortcut(id: string) {
    await deleteShortcut(id);
    setFeedback({ tone: "success", message: "Shortcut deleted." });
  }

  async function handleToggle(enabledNext: boolean) {
    await setEnabled(enabledNext);
    setFeedback({
      tone: "success",
      message: enabledNext ? "Shortcuts enabled." : "Shortcuts disabled.",
    });
  }

  return (
    <div className="min-h-screen bg-surface">
      <AppNav />

      <main className="flex flex-col gap-6 py-6">
        <ShortcutsHeader enabled={enabled} onToggle={handleToggle} />

        {feedback ? (
          <section className="px-8">
            <div
              className={`mx-auto max-w-screen-2xl rounded-xl border px-4 py-3 text-sm ${
                feedback.tone === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {feedback.message}
            </div>
          </section>
        ) : null}

        <section className="px-8">
          <div className="mx-auto grid max-w-screen-2xl gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <ShortcutComposer onSubmit={handleAddShortcut} />
            <ShortcutSandbox />
          </div>
        </section>

        <section className="px-8 pb-8">
          <div className="mx-auto max-w-screen-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-on-surface">Your Shortcuts</h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Edit labels and values here. Trigger names stay stable so your typing
                  muscle memory keeps working.
                </p>
              </div>
              <div className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface-variant">
                {loading ? "Loading..." : `${shortcuts.length} total`}
              </div>
            </div>

            <ShortcutList
              shortcuts={shortcuts}
              onSave={handleSaveShortcut}
              onDelete={handleDeleteShortcut}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
