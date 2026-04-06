import { create } from "zustand";
import { User } from "@supabase/supabase-js";


interface AuthState {
  user : User | null;
  orgId : string | null;
  role : 'admin' | 'member' | null;
  setUser : (user: User | null) => void;
  setOrg : ( orgId: string | null, role: 'admin' | 'member' | null) => void;
  clear : () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  orgId: null,
  role: null,
  setUser: (user) => set({ user }),
  setOrg: (orgId, role) => set({ orgId, role }),
  clear: () => set({ user: null, orgId: null, role: null }),
}));