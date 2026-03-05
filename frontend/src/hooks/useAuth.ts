// src/hooks/useAuth.ts
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { getStoredUser, logout as apiLogout, fetchMe } from "../api/auth";
import type { User } from "../types";
import { createElement } from "react";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({
  user: null, loading: true,
  refresh: async () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]     = useState<User | null>(getStoredUser());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem("access")) return;
    setLoading(true);
    try {
      const u = await fetchMe();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  useEffect(() => {
    if (localStorage.getItem("access") && !user) {
      refresh();
    }
  }, []); // eslint-disable-line

  return createElement(Ctx.Provider, { value: { user, loading, refresh, logout } }, children);
}

export function useAuth() {
  return useContext(Ctx);
}