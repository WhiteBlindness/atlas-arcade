"use client";

import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore, type ToastKind } from "@/store/toastStore";

const STYLE: Record<ToastKind, { border: string; text: string; glow: string; Icon: typeof Info }> = {
  success: { border: "border-arcade-neon-green",  text: "text-arcade-neon-green neon-text-green",   glow: "#00ff4155", Icon: CheckCircle2 },
  error:   { border: "border-arcade-neon-red",    text: "text-arcade-neon-red neon-text-red",       glow: "#ff333355", Icon: XCircle },
  info:    { border: "border-arcade-neon-cyan",   text: "text-arcade-neon-cyan neon-text-cyan",      glow: "#00d4ff55", Icon: Info },
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 w-[92vw] max-w-sm px-2">
      {toasts.map((t) => {
        const s = STYLE[t.kind];
        return (
          <div
            key={t.id}
            role="status"
            className={`w-full flex items-start gap-2 bg-arcade-bg border ${s.border} px-3 py-2 modal-enter`}
            style={{ boxShadow: `0 0 18px ${s.glow}` }}
          >
            <s.Icon size={14} className={`${s.text} shrink-0 mt-0.5`} />
            <p className="flex-1 font-mono text-sm text-gray-200 leading-snug">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="shrink-0 w-6 h-6 flex items-center justify-center text-gray-600 hover:text-white active:scale-90 transition-all"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
