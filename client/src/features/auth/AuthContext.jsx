import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  completeCurrentUserProfile,
  getCurrentUser,
  loginWithEmail,
  logoutCurrentUser,
  registerWithEmail,
  startGoogleSignIn as requestGoogleSignIn,
} from "./auth.api.js";

const AuthContext = createContext(null);
const currentUserQueryKey = ["auth", "currentUser"];

async function loadCurrentUser() {
  try {
    return await getCurrentUser();
  } catch (error) {
    if (error.status === 401) return null;
    throw error;
  }
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const {
    data: currentUser,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: loadCurrentUser,
    // 401 (session expired) returns null instead of throwing, so only
    // network / 5xx errors reach the retry logic.  Retry those a couple
    // of times before surfacing the error.
    retry: 2,
    staleTime: 0,
  });

  useEffect(() => {
    function handleUnauthorized() {
      queryClient.setQueryData(currentUserQueryKey, null);
      queryClient.clear();
      if (typeof window !== "undefined" && window.location.pathname !== "/") {
        window.location.replace("/");
      }
    }

    window.addEventListener("app:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("app:unauthorized", handleUnauthorized);
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    const result = await refetch();
    if (result.error) throw result.error;
    return result.data;
  }, [refetch]);

  const login = useCallback(
    async (credentials) => {
      await loginWithEmail(credentials);
      return refreshUser();
    },
    [refreshUser],
  );

  const register = useCallback(
    async (details) => {
      await registerWithEmail(details);
      return refreshUser();
    },
    [refreshUser],
  );

  const logout = useCallback(async () => {
    try {
      await logoutCurrentUser();
    } finally {
      queryClient.setQueryData(currentUserQueryKey, null);
      queryClient.clear();
      if (typeof window !== "undefined" && window.location.pathname !== "/") {
        window.location.replace("/");
      }
    }
  }, [queryClient]);

  const completeProfile = useCallback(
    async (profile) => {
      const user = await completeCurrentUserProfile(profile);
      queryClient.setQueryData(currentUserQueryKey, user);
      return user;
    },
    [queryClient],
  );

  const startGoogleSignIn = useCallback(
    (callbackURL = window.location.origin) => requestGoogleSignIn(callbackURL),
    [],
  );

  const user = currentUser || null;
  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading: isPending,
      isError,
      error: error || null,
      login,
      register,
      logout,
      refreshUser,
      completeProfile,
      startGoogleSignIn,
    }),
    [
      user,
      isPending,
      isError,
      error,
      login,
      register,
      logout,
      refreshUser,
      completeProfile,
      startGoogleSignIn,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// The provider and its matching hook intentionally share this context module.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
