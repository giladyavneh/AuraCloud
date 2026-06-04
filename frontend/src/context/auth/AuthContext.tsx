import {
  clearToken,
  fetchMe,
  getStoredToken,
  storeToken,
} from "@/services/auth.service";
import type { AuthCustomer } from "@/services/types/auth.types";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextValue {
  customer: AuthCustomer | null;
  isLoading: boolean;
  setAuth: (token: string, customer: AuthCustomer) => void;
  updateCustomer: (customer: AuthCustomer) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [customer, setCustomer] = useState<AuthCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, validate the stored token and hydrate the customer
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetchMe()
      .then(setCustomer)
      .catch(() => clearToken())
      .finally(() => setIsLoading(false));
  }, []);

  const setAuth = useCallback((token: string, incoming: AuthCustomer) => {
    storeToken(token);
    setCustomer(incoming);
  }, []);

  const updateCustomer = useCallback((incoming: AuthCustomer) => {
    setCustomer(incoming);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setCustomer(null);
  }, []);

  return (
    <AuthContext.Provider value={{ customer, isLoading, setAuth, updateCustomer, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
