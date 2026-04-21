"use client";

import { toast } from "sonner";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "./api-client";
import type { User, Token, RegisterPayload, LoginPayload, UserUpdate } from "./types";

// ── Types ──────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  updateProfile: (payload: UserUpdate) => Promise<User>;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (!stored) {
      setIsLoading(false);
      return;
    }
    setToken(stored);

    api
      .get<User>("/auth/me")
      .then((u) => setUser(u))
      .catch(() => {
        // Token expired or invalid — clear it
        localStorage.removeItem("token");
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleAuthResponse = useCallback((data: Token) => {
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const data = await api.post<Token>("/auth/login", payload);
      handleAuthResponse(data);
      return data.user;
    },
    [handleAuthResponse],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const data = await api.post<Token>("/auth/register", payload);
      handleAuthResponse(data);
      return data.user;
    },
    [handleAuthResponse],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (payload: UserUpdate) => {
    try {
      const updated = await api.patch<User>("/auth/me", payload);
      setUser(updated);
      toast.success("Profile updated successfully");
      return updated;
    } catch (err) {
      toast.error("Failed to update profile");
      throw err;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const u = await api.get<User>("/auth/me");
      setUser(u);
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateProfile,
      setUser,
      refreshUser,
    }),
    [user, token, isLoading, login, register, logout, updateProfile, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
