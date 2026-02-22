import { createContext, useState, useEffect, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import api from "../lib/axios";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  authWithGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Try to get user info - if cookie exists, server will authenticate
    api
      .get("/api/auth/me")
      .then((response: { data: { user: User } }) => {
        setUser(response.data.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data } = await api.post("/api/auth/login", { email, password });
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      const { data } = await api.post("/api/auth/signup", { name, email, password });
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const authWithGoogle = useCallback(async (credential: string) => {
    try {
      setLoading(true);
      const { data } = await api.post("/api/auth/google", { credential });
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, authWithGoogle, logout }),
    [user, loading, login, signup, authWithGoogle, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
