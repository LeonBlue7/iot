import { useAuthStore } from '../store/authStore'
import type { LoginCredentials } from '../types/auth'

export function useAuth() {
  const { token, user, isAuthenticated, isLoading, login, logout, clearToken } = useAuthStore()

  const handleLogin = async (credentials: LoginCredentials) => {
    await login(credentials)
  }

  const handleLogout = () => {
    logout()
  }

  return {
    token,
    user,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    clearToken,
  }
}
