"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user:    null,
    session: null,
    loading: true,
  });
  const [isSigningIn,  setIsSigningIn]  = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Resolve initial session (also handles OAuth redirect token in URL hash)
    supabase.auth.getSession().then(({ data }) => {
      setState({
        user:    data.session?.user ?? null,
        session: data.session ?? null,
        loading: false,
      });
    });

    // Subscribe to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Sync session to extension background for autofill logging
        if (typeof window !== "undefined") {
          window.postMessage({ action: "JOBFILL_SET_SESSION", session }, "*");
        }

        setState({
          user:    session?.user ?? null,
          session: session ?? null,
          loading: false,
        });

        // SIGNED_IN fires when the listener is already active (e.g. sign-in on a
        // protected page). INITIAL_SESSION fires when detectSessionInUrl processes
        // the OAuth ?code= before the listener subscribes — both mean a fresh login.
        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
          const destination = sessionStorage.getItem("jf_auth_return") || "/profile";
          sessionStorage.removeItem("jf_auth_return");
          router.push(destination);
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
