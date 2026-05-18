"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, login as doLogin, logout as doLogout } from "@/lib/auth";
import { type User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  refresh: () => void;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      return getCurrentUser();
    } catch {
      return null;
    }
  });

  const refresh = useCallback(() => {
    try {
      setUser(getCurrentUser());
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await doLogin(email, password);
    if (!res.ok) return res;
    refresh();
    return { ok: true as const };
  }, [refresh]);

  const logout = useCallback(() => {
    doLogout();
    refresh();
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, refresh, login, logout }),
    [user, refresh, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
