"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios, { AxiosError } from "axios";
import type { AuthUser } from "@/lib/auth-types";
import { parseAuthUser, unwrapApiData } from "@/lib/auth-types";
import { API_PROXY_PATH, resolveApiBaseUrl } from "@/lib/apiBaseUrl";

interface AuthType {
  user: AuthUser | null;
  token: string | null;
  api_base_url: string;
  http: ReturnType<typeof axios.create>;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthType | null>(null);

const STORAGE_TOKEN = "token";
const STORAGE_USER = "user";

async function persistSession(token: string, user: AuthUser) {
  localStorage.setItem(STORAGE_TOKEN, token);
  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, user }),
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isLoggingOutRef = useRef(false);

  const api_base_url = resolveApiBaseUrl();
  const api_url = API_PROXY_PATH;

  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_TOKEN);
    const storedUser = localStorage.getItem(STORAGE_USER);

    if (!storedToken || !storedUser) {
      setLoading(false);
      return;
    }

    try {
      const parsed = parseAuthUser(JSON.parse(storedUser));
      if (!parsed) {
        localStorage.removeItem(STORAGE_TOKEN);
        localStorage.removeItem(STORAGE_USER);
        setLoading(false);
        return;
      }
      setToken(storedToken);
      setUser(parsed);
    } catch {
      localStorage.removeItem(STORAGE_TOKEN);
      localStorage.removeItem(STORAGE_USER);
    }
    setLoading(false);
  }, []);

  const http = useMemo(
    () =>
      axios.create({
        baseURL: api_url,
      }),
    [api_url],
  );

  if (typeof window !== "undefined") {
    if (token) {
      http.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete http.defaults.headers.common.Authorization;
    }
  }

  const logout = useCallback(() => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    const currentToken = token;
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
    void fetch("/api/auth/session", { method: "DELETE" });
    if (currentToken) {
      void http.post("/logout").catch(() => undefined);
    }
    window.location.href = "/login";
  }, [http, token]);

  useEffect(() => {
    const interceptorId = http.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ message?: string; error?: string }>) => {
        const status = error?.response?.status;
        const apiMessage =
          String(error?.response?.data?.message || "").toLowerCase() +
          " " +
          String(error?.response?.data?.error || "").toLowerCase();
        const tokenExpired =
          status === 401 ||
          status === 419 ||
          apiMessage.includes("token") ||
          apiMessage.includes("unauth");

        const isLoginPage =
          typeof window !== "undefined" &&
          window.location.pathname.startsWith("/login");

        if (tokenExpired && !isLoginPage) {
          logout();
        }

        return Promise.reject(error);
      },
    );

    return () => {
      http.interceptors.response.eject(interceptorId);
    };
  }, [http, logout]);

  const login = async (email: string, password: string) => {
    const { data } = await http.post("/login", { email, password });
    const payload = unwrapApiData<{ token: string; user: AuthUser }>(data);
    if (!payload?.token || !payload.user) {
      throw new Error("Resposta de login inválida.");
    }
    const authUser = parseAuthUser(payload.user);
    if (!authUser) {
      throw new Error("Dados do utilizador inválidos.");
    }
    setToken(payload.token);
    setUser(authUser);
    await persistSession(payload.token, authUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        http,
        loading,
        logout,
        login,
        setUser,
        api_base_url,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be inside AuthProvider");
  return context;
};
