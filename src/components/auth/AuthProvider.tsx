"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { useCoinStore } from "@/store/coinStore";
import { storeReferralCode, redeemPendingReferral } from "@/lib/supabase/profile";
import { toast } from "@/store/toastStore";
import { useT } from "@/lib/i18n";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const t = useT();
  const setUser = useAuthStore((s) => s.setUser);
  const loadCoins = useCoinStore((s) => s.load);
  const resetCoins = useCoinStore((s) => s.reset);

  // Capture ?ref=CODE on landing and park it until the player signs up. Done
  // before anything else so an immediate OAuth redirect still finds it.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref");
    if (!code) return;
    storeReferralCode(code);
    // Tidy the URL so the code isn't carried around or re-shared by accident.
    const url = new URL(window.location.href);
    url.searchParams.delete("ref");
    window.history.replaceState({}, "", url.toString());
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      loadCoins(); // guests get a local daily allowance too
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        resetCoins();

        // Redeem a pending invite once we actually have a session. This covers
        // BOTH email sign-up and Google OAuth: the /auth/callback route runs on
        // the server and can't read localStorage, but this fires after the
        // redirect lands. The RPC allows one redemption per account, so signing
        // in again later is a no-op.
        if (event === "SIGNED_IN" && session) {
          redeemPendingReferral()
            .then(async (granted) => {
              await loadCoins(); // pick up the bonus balance
              if (granted) toast.success(t("toastReferralBonus"));
            })
            .catch(() => loadCoins());
        } else {
          loadCoins();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, loadCoins, resetCoins, t]);

  return <>{children}</>;
}
