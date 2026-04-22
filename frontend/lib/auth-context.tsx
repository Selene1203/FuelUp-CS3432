"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { getToken, setToken, clearToken, api, type User } from "./api";

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  loading: boolean;
  login: (token: string, admin?: boolean) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = getToken();
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
      return;
    }

    try {
      // Try to get user profile - if it fails, might be admin
      const userData = await api<User>("/api/users/profile", {
        requiresAuth: true,
      });
      setUser(userData);
      setIsAuthenticated(true);
      setIsAdmin(false);
    } catch {
      // Could be an admin token - check admin endpoint
      try {
        await api<unknown>("/api/admin/station", { requiresAuth: true });
        setIsAuthenticated(true);
        setIsAdmin(true);
        setUser(null);
      } catch {
        // Token is invalid
        clearToken();
        setIsAuthenticated(false);
        setUser(null);
        setIsAdmin(false);
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await refreshUser();
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = (token: string, admin = false) => {
    setToken(token);
    setIsAuthenticated(true);
    setIsAdmin(admin);
    if (!admin) {
      refreshUser();
    }
  };

  const logout = () => {
    clearToken();
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        user,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
