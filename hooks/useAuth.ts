"use client";

import { useState, useEffect, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase";

interface AuthState {
  user:    User | null;
  session: Session | null;
  loading: boolean;
}

interface UseAuthReturn extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signOut:          () => Promise<void>;
  isSigningIn:      boolean;
  isSigningOut:     boolean;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user:    null,
    session: null,
    loading: true,
  });
  const [isSigningIn,  setIsSigningIn]  = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();

    console.log("[useAuth] effect running — hash:", window.location.hash.slice(0, 40) || "(none)");
    console.log("[useAuth] jf_auth_return in sessionStorage:", sessionStorage.getItem("jf_auth_return"));

    // Resolve initial session (also handles OAuth redirect token in URL hash)
    supabase.auth.getSession().then(({ data }) => {
      console.log("[useAuth] getSession resolved — user:", data.session?.user?.email ?? "null");
      setState({
        user:    data.session?.user ?? null,
        session: data.session ?? null,
        loading: false,
      });
    });

    // Subscribe to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[useAuth] onAuthStateChange —", event, "| user:", session?.user?.email ?? "null");

        // Sync session to extension background for autofill logging
        if (typeof window !== "undefined") {
          window.postMessage({ action: "JOBFILL_SET_SESSION", session }, "*");
        }

        setState({
          user:    session?.user ?? null,
          session: session ?? null,
          loading: false,
        });

        // jf_auth_return is only written by signInWithGoogle, so its presence
        // means we're landing back from an OAuth redirect. Use window.location
        // rather than router.push — the Next.js router can silently drop pushes
        // fired inside auth callbacks before hydration settles.
        if (session) {
          const destination = sessionStorage.getItem("jf_auth_return");
          console.log("[useAuth] session present — jf_auth_return:", destination ?? "(not set)");
          if (destination) {
            console.log("[useAuth] redirecting to:", destination);
            sessionStorage.removeItem("jf_auth_return");
            window.location.replace(destination);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabaseClient();
    setIsSigningIn(true);
    try {
      // Save where to go after auth — sessionStorage survives the OAuth redirect
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
      const destination = currentPath === "/" ? "/profile" : currentPath;
      console.log("[useAuth] signInWithGoogle — saving jf_auth_return:", destination);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("jf_auth_return", destination);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options:  {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          scopes: "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets"
        },
      });
      if (error) throw error;
      // Page will redirect — no further code runs
    } catch (err) {
      console.error("[JobFill] Sign-in failed:", err);
      setIsSigningIn(false);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[JobFill] Sign-out failed:", err);
    } finally {
      setIsSigningOut(false);
    }
  }, []);

  return { ...state, signInWithGoogle, signOut, isSigningIn, isSigningOut };
}
