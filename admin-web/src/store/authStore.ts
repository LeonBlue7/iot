import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthStore, LoginCredentials, AuthState } from '../types/auth'
import { authApi } from '../services/auth.service'

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true })
        try {
          const { token, user } = await authApi.login(credentials)
          set({
            token,
            user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        set(initialState)
      },

      setToken: (token: string) => {
        set({ token, isAuthenticated: true })
      },

      clearToken: () => {
        set({ token: null, isAuthenticated: false, user: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
