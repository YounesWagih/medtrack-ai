import { useAuthStore } from '@/stores/auth.store';
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useAuth() {
  const { user, token, isLoading, isAuthenticated, login, register, logout, checkAuth } = useAuthStore();

  const handleLogin = useCallback(async (email: string, password: string) => {
    await login(email, password);
  }, [login]);

  const handleRegister = useCallback(async (name: string, email: string, password: string) => {
    await register(name, email, password);
  }, [register]);

  const queryClient = useQueryClient();

  const handleLogout = useCallback(() => {
    // Clear React Query cache
    queryClient.clear();
    logout();
  }, [logout, queryClient]);

  const isChecked = useCallback(() => {
    return checkAuth();
  }, [checkAuth]);

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    checkAuth: isChecked,
  };
}
