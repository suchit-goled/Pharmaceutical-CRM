import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import api from "../services/api";

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role: "ADMIN" | "SALES_REP" | "MEDICAL_DIRECTOR" | "COMPLIANCE_OFFICER";
  territory_id?: number | null;
  phone?: string | null;
  is_active: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("medintel_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("medintel_token"));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAuth() {
      const savedToken = localStorage.getItem("medintel_token");
      if (savedToken) {
        try {
          const res = await api.get("/api/auth/me");
          setUser(res.data);
          localStorage.setItem("medintel_user", JSON.stringify(res.data));
        } catch (err) {
          console.warn("Session expired or invalid, logging out");
          logout();
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, []);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    const res = await api.post("/api/auth/login", { email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem("medintel_token", access_token);
    localStorage.setItem("medintel_user", JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("medintel_token");
    localStorage.removeItem("medintel_user");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin }}>
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
