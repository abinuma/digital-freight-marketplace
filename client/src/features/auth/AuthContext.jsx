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
    // Avoid retrying expired or suspended sessions; retry transient failures.
    retry: (failureCount, queryError) => {
      if ([401, 403].includes(queryError?.status ?? queryError?.response?.status)) return false;
      return failureCount < 2;
    },
    refetchInterval: (query) => query.state.data?.status === 'ACTIVE' ? 15_000 : false,
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

  useEffect(() => {
    function handleAccountSuspended() {
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        queryClient.clear();
        window.location.replace('/');
      } else {
        queryClient.setQueryData(currentUserQueryKey, null);
      }
    }

    window.addEventListener('app:account-suspended', handleAccountSuspended);
    return () => window.removeEventListener('app:account-suspended', handleAccountSuspended);
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    const result = await refetch();
    if (result.error) throw result.error;
    return result.data;
  }, [refetch]);

  const login = useCallback(
    async (credentials) => {
      await loginWithEmail(credentials);
      const user = await refreshUser();
      if (!user) {
        throw new Error('Unable to establish a session. Please verify that your browser allows cross-site cookies, or check your backend CORS and cookie settings.');
      }
      return user;
    },
    [refreshUser],
  );

  const register = useCallback(
    async (details) => {
      await registerWithEmail(details);
      const user = await refreshUser();
      if (!user) {
        throw new Error('Unable to establish a session. Please verify that your browser allows cross-site cookies, or check your backend CORS and cookie settings.');
      }
      return user;
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
