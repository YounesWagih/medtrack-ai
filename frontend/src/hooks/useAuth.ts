import { useAuthStore } from '@/stores/auth.store';
import { useCallback } from 'react';

export function useAuth() {
  const { user, token, isLoading, isAuthenticated, login, register, logout, checkAuth } = useAuthStore();

  const handleLogin = useCallback(async (email: string, password: string) => {
    await login(email, password);
  }, [login]);

  const handleRegister = useCallback(async (name: string, email: string, password: string) => {
    await register(name, email, password);
  }, [register]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

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
