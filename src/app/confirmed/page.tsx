"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function ConfirmedPage() {
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    // supabase-js auto-parses the confirmation tokens from the URL hash
    supabase.auth.getSession().then(({ data }) => {
      setOk(!!data.session);
      setReady(true);
    });
  }, []);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 bg-arcade-bg px-4 text-center">
      {!ready ? (
        <Loader2 size={28} className="text-arcade-neon-cyan animate-spin" />
      ) : (
        <>
          <CheckCircle2 size={40} className="text-arcade-neon-green" />
          <div className="space-y-2">
            <h1 className="font-pixel text-sm text-arcade-neon-green neon-text-green tracking-widest">
              EMAIL CONFIRMED
            </h1>
            <p className="font-mono text-sm text-gray-400">
              {ok ? "You're verified and signed in. Let's play." : "Your email is verified — sign in to play."}
            </p>
          </div>
          <Link
            href="/"
            className="font-pixel text-[10px] border border-arcade-neon-cyan text-arcade-neon-cyan neon-text-cyan px-6 py-3 hover:bg-arcade-neon-cyan hover:text-black active:scale-95 transition-all"
            style={{ boxShadow: "0 0 12px #00d4ff55" }}
          >
            ← BACK TO ARCADE
          </Link>
        </>
      )}
    </div>
  );
}
