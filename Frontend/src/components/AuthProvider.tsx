"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiRequest } from "@/lib/api";

export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  occupation?: string | null;
  address_line?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  pan_masked?: string | null;
  aadhaar_masked?: string | null;
  residency_status?: string | null;
  entity_type?: string | null;
  created_at: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  updateProfile: (payload: Record<string, unknown>) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setUser(await apiRequest<AuthUser>("/api/auth/me"));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (payload: Record<string, unknown>) => {
    const updated = await apiRequest<AuthUser>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    setUser(updated);
    return updated;
  }, []);

  useEffect(() => {
    let active = true;
    apiRequest<AuthUser>("/api/auth/me")
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const logout = useCallback(async () => {
    await apiRequest<void>("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, updateProfile, logout }),
    [user, loading, refresh, updateProfile, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
