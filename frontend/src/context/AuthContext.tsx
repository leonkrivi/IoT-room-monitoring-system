import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { api } from "@/lib/api";

interface AuthState {
  isAuthenticated: boolean;
  passwordChangeRequired: boolean;
}

interface AuthContextValue extends AuthState {
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    passwordChangeRequired: false,
  });

  const login = useCallback(async (password: string) => {
    const response = await api.auth.login(password);
    const passwordChangeRequired = Boolean(response.passwordChangeRequired);
    setState({ isAuthenticated: true, passwordChangeRequired });
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setState({ isAuthenticated: false, passwordChangeRequired: false });
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    await api.auth.changePassword(newPassword);
    setState((prev) => ({ ...prev, passwordChangeRequired: false }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
