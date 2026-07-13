"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { useCoinStore } from "@/store/coinStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const loadCoins = useCoinStore((s) => s.load);
  const resetCoins = useCoinStore((s) => s.reset);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadCoins();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null);
        if (session?.user) loadCoins();
        else resetCoins();
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, loadCoins, resetCoins]);

  return <>{children}</>;
}
