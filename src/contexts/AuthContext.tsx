import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  WorkestraUser,
  WorkestraAuthError,
  loginWithWorkestra,
  verifyWorkestraToken,
  logoutWorkestra,
} from "../lib/workestraAuth";

interface AuthContextType {
  user: WorkestraUser | null;
  authToken: string | null;
  loading: boolean;
  ssoError: WorkestraAuthError | null;
  clearSsoError: () => void;
  signInWithWorkestra: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<WorkestraUser | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("workestra_user_cache");
        if (cached) return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    return null;
  });
  const [authToken, setAuthToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("workestra_auth_token");
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [ssoError, setSsoError] = useState<WorkestraAuthError | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (typeof window === "undefined") {
        if (active) setLoading(false);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const ssoToken = params.get("sso") || params.get("token");
      const storedToken = localStorage.getItem("workestra_auth_token");
      const tokenToVerify = ssoToken || storedToken;

      if (!tokenToVerify) {
        if (active) setLoading(false);
        return;
      }

      if (ssoToken) {
        // Remove token from address bar without reloading
        params.delete("sso");
        params.delete("token");
        const remainingQuery = params.toString();
        const cleanUrl =
          window.location.pathname +
          (remainingQuery ? `?${remainingQuery}` : "") +
          window.location.hash;
        window.history.replaceState({}, "", cleanUrl);
      }

      try {
        const session = await verifyWorkestraToken(tokenToVerify);
        if (!active) return;
        setUser(session.user);
        setAuthToken(session.token);
        localStorage.setItem("workestra_auth_token", session.token);
        localStorage.setItem("workestra_user_cache", JSON.stringify(session.user));
        setSsoError(null);
        setIsLoginModalOpen(false);
      } catch (err) {
        if (!active) return;
        setUser(null);
        setAuthToken(null);
        localStorage.removeItem("workestra_auth_token");
        localStorage.removeItem("workestra_user_cache");
        if (ssoToken) {
          if (err instanceof WorkestraAuthError) {
            setSsoError(err);
          } else {
            setSsoError(new WorkestraAuthError("INVALID_TOKEN"));
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const handleSignInWithWorkestra = useCallback(async (email: string, password: string) => {
    setSsoError(null);
    const session = await loginWithWorkestra(email, password);
    setUser(session.user);
    setAuthToken(session.token);
    localStorage.setItem("workestra_auth_token", session.token);
    localStorage.setItem("workestra_user_cache", JSON.stringify(session.user));
    setIsLoginModalOpen(false);
  }, []);

  const handleLogOut = useCallback(async () => {
    const currentToken = authToken;
    setUser(null);
    setAuthToken(null);
    setSsoError(null);
    localStorage.removeItem("workestra_auth_token");
    localStorage.removeItem("workestra_user_cache");
    await logoutWorkestra(currentToken);
  }, [authToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        authToken,
        loading,
        ssoError,
        clearSsoError: () => setSsoError(null),
        signInWithWorkestra: handleSignInWithWorkestra,
        logOut: handleLogOut,
        isLoginModalOpen,
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false),
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
