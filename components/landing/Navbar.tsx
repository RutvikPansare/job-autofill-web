"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const NAV_LINKS = [
  { label: "Product",      href: "#" },
  { label: "Features",     href: "#features" },
  { label: "Pricing",      href: "#pricing" },
  { label: "How it Works", href: "#how-it-works" },
];

const GOOGLE_ICON = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function Navbar() {
  const { user, loading, signInWithGoogle, signOut, isSigningIn, isSigningOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoAuthStartedRef = useRef(false);

  async function handleSignIn() {
    try {
      await signInWithGoogle();
    } catch {
      alert("Sign-in failed. Please try again.");
    }
  }

  useEffect(() => {
    const authMode = searchParams.get("auth");
    if (authMode !== "google") return;
    if (loading || user || isSigningIn || autoAuthStartedRef.current) return;

    autoAuthStartedRef.current = true;
    signInWithGoogle().catch(() => {
      autoAuthStartedRef.current = false;
      alert("Sign-in failed. Please try again.");
    });
  }, [searchParams, loading, user, isSigningIn, signInWithGoogle]);

  // After OAuth callback lands on "/", detect session and redirect
  useEffect(() => {
    if (loading || !user) return;
    const destination = sessionStorage.getItem("jf_auth_return") || "/profile";
    sessionStorage.removeItem("jf_auth_return");
    router.replace(destination);
  }, [loading, user, router]);

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0b1326]/80 backdrop-blur-xl transition-all shadow-2xl shadow-indigo-900/20 font-['Inter'] antialiased border-b border-white/5">
      <div className="flex justify-between items-center max-w-7xl mx-auto px-6 py-4">

        {/* Logo */}
        <div className="text-2xl font-black tracking-tighter text-white">JobFill</div>

        {/* Desktop nav links */}
        <div className="hidden md:flex gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-slate-400 font-medium hover:text-indigo-400 transition-colors duration-300 hover:scale-[1.02]"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex gap-4 items-center">
          {loading ? (
            // Skeleton while loading
            <div className="w-24 h-8 rounded-full bg-white/5 animate-pulse" />
          ) : user ? (
            // Signed-in state
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-surface-container-high/60 px-4 py-2 rounded-full border border-outline-variant/20">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm font-medium text-on-surface-variant">Connected · </span>
                <span className="text-sm font-semibold text-white max-w-[160px] truncate">{user.email}</span>
              </div>
              <button
                onClick={signOut}
                disabled={isSigningOut}
                className="text-slate-500 hover:text-white text-sm font-medium transition-colors duration-200 disabled:opacity-50"
              >
                {isSigningOut ? "Signing out…" : "Logout"}
              </button>
            </div>
          ) : (
            // Signed-out state
            <div className="flex gap-4 items-center">
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors duration-300 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {GOOGLE_ICON}
                {isSigningIn ? "Connecting…" : "Sign In"}
              </button>
              <Link
                href="/profile"
                className="bg-gradient-to-r from-primary-container to-secondary-container text-white px-6 py-2.5 rounded-full font-semibold hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-primary-container/20 border-t border-primary-fixed-dim/20"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined">{mobileOpen ? "close" : "menu"}</span>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0b1326]/95 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex flex-col gap-4">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-slate-400 font-medium hover:text-indigo-400 transition-colors py-2"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </a>
          ))}
          <div className="pt-2 border-t border-white/10 flex flex-col gap-3">
            {user ? (
              <>
                <span className="text-sm text-on-surface-variant">{user.email}</span>
                <button onClick={signOut} className="text-slate-400 hover:text-white text-sm font-medium text-left">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="text-indigo-400 font-semibold flex items-center gap-2 disabled:opacity-60"
                >
                  {GOOGLE_ICON}
                  {isSigningIn ? "Connecting…" : "Sign In"}
                </button>
                <Link href="/profile" className="bg-gradient-to-r from-primary-container to-secondary-container text-white px-5 py-2.5 rounded-full font-semibold text-center">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
