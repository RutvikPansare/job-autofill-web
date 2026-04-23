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

        // Skip INITIAL_SESSION to avoid race where UI resets before session resolves
        if (event === "INITIAL_SESSION") return;
        setState({
          user:    session?.user ?? null,
          session: session ?? null,
          loading: false,
        });
      }
    );

    // Initial sync
    supabase.auth.getSession().then(({ data }) => {
      if (typeof window !== "undefined" && data.session) {
        window.postMessage({ action: "JOBFILL_SET_SESSION", session: data.session }, "*");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabaseClient();
    setIsSigningIn(true);
    try {
      const redirectTo = typeof window !== "undefined"
        ? window.location.origin + window.location.pathname
        : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options:  { 
          redirectTo,
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
