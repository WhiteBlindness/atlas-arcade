"use client";

import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

interface AuthStore {
  user: User | null;
  loading: boolean;
  modalOpen: boolean;
  modalTab: "signin" | "signup";
  profileOpen: boolean;
  setUser: (user: User | null) => void;
  openModal: (tab?: "signin" | "signup") => void;
  closeModal: () => void;
  openProfile: () => void;
  closeProfile: () => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  modalOpen: false,
  modalTab: "signin",
  profileOpen: false,
  setUser: (user) => set({ user, loading: false }),
  openModal: (tab = "signin") => set({ modalOpen: true, modalTab: tab }),
  closeModal: () => set({ modalOpen: false }),
  openProfile: () => set({ profileOpen: true }),
  closeProfile: () => set({ profileOpen: false }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
