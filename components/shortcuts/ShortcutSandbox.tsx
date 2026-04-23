"use client";

export default function ShortcutSandbox() {
  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-on-surface">Try It Out</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Type your triggers here to test them. The same expansion behavior is used in
          supported job application forms.
        </p>
      </div>

      <textarea
        id="shortcutSandbox"
        rows={5}
        placeholder="Type /name, /email, or any custom trigger here..."
        className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
      />

      <p className="mt-3 text-xs leading-5 text-on-surface-variant">
        Built-in variables such as <code className="rounded bg-surface-container px-1.5 py-0.5 text-[11px]">/name</code> and{" "}
        <code className="rounded bg-surface-container px-1.5 py-0.5 text-[11px]">/email</code> continue to work exactly as before.
      </p>
    </div>
  );
}
