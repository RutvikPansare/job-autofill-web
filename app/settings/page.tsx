"use client";

import AppNav from "@/components/app/AppNav";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
  const { user, loading, isSigningIn, isSigningOut, signInWithGoogle, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <AppNav />

      <main className="px-8 py-8">
        <div className="mx-auto max-w-screen-2xl">
          <h1 className="mb-1 text-2xl font-black tracking-tight text-on-surface">
            Settings
          </h1>
          <p className="mb-8 text-sm text-on-surface-variant">
            Manage your account and session.
          </p>

          <div className="max-w-lg space-y-6">

            {/* ── Account card ── */}
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Account
              </h2>

              {loading ? (
                <p className="text-sm text-on-surface-variant">Loading…</p>
              ) : user ? (
                /* Signed-in state */
                <div>
                  <p className="mb-1 text-xs text-on-surface-variant">Signed in as</p>
                  <p className="mb-1 text-base font-semibold text-on-surface">
                    {user.user_metadata?.full_name ?? user.email}
                  </p>
                  {user.user_metadata?.full_name && (
                    <p className="mb-6 text-sm text-on-surface-variant">{user.email}</p>
                  )}

                  <button
                    onClick={signOut}
                    disabled={isSigningOut}
                    className="inline-flex items-center gap-2 rounded-xl border border-error/30 bg-transparent px-5 py-2.5 text-sm font-semibold text-error transition-all hover:border-error hover:bg-error/8 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSigningOut ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[16px]">
                          progress_activity
                        </span>
                        Signing out…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">logout</span>
                        Sign Out
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Signed-out state */
                <div>
                  <p className="mb-5 text-sm text-on-surface-variant">
                    Sign in to sync your profile, access the job tracker, and use all BoltApply features across devices.
                  </p>

                  <button
                    onClick={signInWithGoogle}
                    disabled={isSigningIn}
                    className="inline-flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface px-5 py-3 text-sm font-semibold text-on-surface shadow-sm transition-all hover:border-primary/30 hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSigningIn ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">
                          progress_activity
                        </span>
                        Redirecting…
                      </>
                    ) : (
                      <>
                        {/* Google "G" logo */}
                        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                          <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.1-6.1C34.6 3.1 29.6 1 24 1 14.82 1 7.07 6.6 3.67 14.44l7.1 5.52C12.47 13.48 17.77 9.5 24 9.5z"/>
                          <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.43-4.75H24v9h12.67c-.55 2.96-2.2 5.47-4.68 7.15l7.19 5.58C43.18 37.3 46.52 31.4 46.52 24.5z"/>
                          <path fill="#FBBC05" d="M10.77 28.04A14.5 14.5 0 0 1 9.5 24c0-1.41.24-2.78.67-4.06L3.07 14.4A23 23 0 0 0 1 24c0 3.73.9 7.26 2.67 10.38l7.1-6.34z"/>
                          <path fill="#34A853" d="M24 47c5.6 0 10.3-1.85 13.74-5.02l-7.19-5.58c-1.89 1.27-4.31 2.02-6.55 2.02-6.23 0-11.52-4-13.41-9.38l-7.1 6.34C7.07 41.38 14.82 47 24 47z"/>
                          <path fill="none" d="M1 1h46v46H1z"/>
                        </svg>
                        Sign in with Google
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
