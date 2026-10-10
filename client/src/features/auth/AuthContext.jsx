import { createContext, useCallback, useContext, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  completeCurrentUserProfile,
  getCurrentUser,
  loginWithEmail,
  logoutCurrentUser,
  registerWithEmail,
  startGoogleSignIn as requestGoogleSignIn,
} from './auth.api.js';

const AuthContext = createContext(null);
const currentUserQueryKey = ['auth', 'currentUser'];

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
    retry: false,
    staleTime: 60_000,
  });

  const refreshUser = useCallback(async () => {
    const result = await refetch();
    if (result.error) throw result.error;
    return result.data;
  }, [refetch]);

  const login = useCallback(async (credentials) => {
    await loginWithEmail(credentials);
    return refreshUser();
  }, [refreshUser]);

  const register = useCallback(async (details) => {
    await registerWithEmail(details);
    return refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    await logoutCurrentUser();
    queryClient.clear();
    queryClient.setQueryData(currentUserQueryKey, null);
  }, [queryClient]);

  const completeProfile = useCallback(async (profile) => {
    const user = await completeCurrentUserProfile(profile);
    queryClient.setQueryData(currentUserQueryKey, user);
    return user;
  }, [queryClient]);

  const startGoogleSignIn = useCallback(
    (callbackURL = window.location.origin) => requestGoogleSignIn(callbackURL),
    [],
  );

  const user = currentUser || null;
  const value = useMemo(() => ({
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
  }), [
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
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// The provider and its matching hook intentionally share this context module.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
