import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '../authStore'
import { authApi } from '../../services/auth.service'
import type { LoginResponse } from '../../services/auth.service'

vi.mock('../../services/auth.service')

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have correct initial state', () => {
    const store = useAuthStore.getState()
    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.isLoading).toBe(false)
  })

  it('should have login method', () => {
    const store = useAuthStore.getState()
    expect(store.login).toBeDefined()
    expect(typeof store.login).toBe('function')
  })

  it('should have logout method', () => {
    const store = useAuthStore.getState()
    expect(store.logout).toBeDefined()
    expect(typeof store.logout).toBe('function')
  })

  it('should have setToken method', () => {
    const store = useAuthStore.getState()
    expect(store.setToken).toBeDefined()
    expect(typeof store.setToken).toBe('function')
  })

  it('should have clearToken method', () => {
    const store = useAuthStore.getState()
    expect(store.clearToken).toBeDefined()
    expect(typeof store.clearToken).toBe('function')
  })

  describe('login', () => {
    it('should set authentication state on successful login', async () => {
      const mockCredentials = { username: 'admin', password: 'password' }
      const mockResponse = {
        token: 'test-token',
        user: { id: 1, username: 'admin', email: 'admin@example.com', name: 'Admin', permissions: [] },
      }
      vi.mocked(authApi.login).mockResolvedValue(mockResponse)

      const store = useAuthStore.getState()
      await store.login(mockCredentials)

      const state = useAuthStore.getState()
      expect(state.token).toBe('test-token')
      expect(state.user).toEqual(mockResponse.user)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isLoading).toBe(false)
    })

    it('should set loading state during login', async () => {
      const mockCredentials = { username: 'admin', password: 'password' }
      vi.mocked(authApi.login).mockImplementation(
        () => new Promise<LoginResponse>((resolve) => setTimeout(() => resolve({ token: 'token', user: { id: 1, username: 'admin', email: 'admin@example.com', name: 'Admin', permissions: [] } }), 100))
      )

      const store = useAuthStore.getState()
      store.login(mockCredentials)

      // Check loading state during login
      const state = useAuthStore.getState()
      expect(state.isLoading).toBe(true)
    })

    it('should handle login error', async () => {
      const mockCredentials = { username: 'admin', password: 'wrong' }
      vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'))

      const store = useAuthStore.getState()
      await expect(store.login(mockCredentials)).rejects.toThrow('Invalid credentials')

      const state = useAuthStore.getState()
      expect(state.isLoading).toBe(false)
    })
  })

  describe('logout', () => {
    it('should clear authentication state', () => {
      const store = useAuthStore.getState()
      store.setToken('test-token')

      expect(useAuthStore.getState().isAuthenticated).toBe(true)

      store.logout()

      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('setToken', () => {
    it('should set token and authenticate', () => {
      const store = useAuthStore.getState()
      store.setToken('new-token')

      const state = useAuthStore.getState()
      expect(state.token).toBe('new-token')
      expect(state.isAuthenticated).toBe(true)
    })
  })

  describe('clearToken', () => {
    it('should clear all auth state', () => {
      const store = useAuthStore.getState()
      store.setToken('test-token')
      store.clearToken()

      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
    })
  })
})
