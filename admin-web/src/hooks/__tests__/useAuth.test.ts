import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '../useAuth'
import { useAuthStore } from '../../store/authStore'

vi.mock('../../store/authStore')

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return auth state from store', () => {
    const mockStoreState = {
      token: 'test-token',
      user: { id: 1, username: 'admin', name: 'Admin' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      clearToken: vi.fn(),
    }
    vi.mocked(useAuthStore).mockReturnValue(mockStoreState as any)

    const { result } = renderHook(() => useAuth())

    expect(result.current.token).toBe('test-token')
    expect(result.current.user).toEqual({ id: 1, username: 'admin', name: 'Admin' })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  it('should return not authenticated state', () => {
    const mockStoreState = {
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      clearToken: vi.fn(),
    }
    vi.mocked(useAuthStore).mockReturnValue(mockStoreState as any)

    const { result } = renderHook(() => useAuth())

    expect(result.current.token).toBeNull()
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should call store login when login is called', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined)
    const mockStoreState = {
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      logout: vi.fn(),
      clearToken: vi.fn(),
    }
    vi.mocked(useAuthStore).mockReturnValue(mockStoreState as any)

    const { result } = renderHook(() => useAuth())

    await result.current.login({ username: 'admin', password: 'password' })

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ username: 'admin', password: 'password' })
    })
  })

  it('should call store logout when logout is called', () => {
    const mockLogout = vi.fn()
    const mockStoreState = {
      token: 'test-token',
      user: { id: 1, username: 'admin' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: mockLogout,
      clearToken: vi.fn(),
    }
    vi.mocked(useAuthStore).mockReturnValue(mockStoreState as any)

    const { result } = renderHook(() => useAuth())

    result.current.logout()

    expect(mockLogout).toHaveBeenCalled()
  })
})
