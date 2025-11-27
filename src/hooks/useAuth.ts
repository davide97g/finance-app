import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { db } from "../lib/db";
import { User } from "@supabase/supabase-js";

/**
 * Hook for managing user authentication state via Supabase Auth.
 *
 * Automatically subscribes to auth state changes and handles
 * local cache cleanup on sign out.
 *
 * @returns Object containing:
 *   - `user`: Current authenticated user or null
 *   - `loading`: Whether initial auth check is in progress
 *   - `signOut`: Function to sign out and clear local data
 *
 * @example
 * ```tsx
 * const { user, loading, signOut } = useAuth();
 *
 * if (loading) return <Spinner />;
 * if (!user) return <LoginPage />;
 *
 * return (
 *   <div>
 *     Welcome, {user.email}
 *     <button onClick={signOut}>Sign Out</button>
 *   </div>
 * );
 * ```
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Clear local cache on sign out
      if (event === "SIGNED_OUT") {
        await db.clearLocalCache();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Clear local cache before signing out
    await db.clearLocalCache();
    return supabase.auth.signOut();
  };

  return { user, loading, signOut };
}
