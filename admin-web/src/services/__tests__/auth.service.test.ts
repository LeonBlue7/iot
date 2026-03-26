import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authApi } from '../auth.service'

// Use vi.hoisted to define mock before vi.mock is hoisted
const mockAxios = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('../../utils/axios', () => ({
  default: mockAxios,
}))

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should return token and user on successful login', async () => {
      const mockResponse = {
        success: true as const,
        data: {
          token: 'test-token-123',
          user: {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            name: '系统管理员',
            permissions: [],
          },
        },
      }

      mockAxios.post.mockResolvedValue({ data: mockResponse } as any)

      const result = await authApi.login({ username: 'admin', password: 'admin123' })

      expect(mockAxios.post).toHaveBeenCalledWith('/admin/auth/login', {
        username: 'admin',
        password: 'admin123',
      })
      expect(result.token).toBe('test-token-123')
      expect(result.user.username).toBe('admin')
    })

    it('should throw error on failed login', async () => {
      const mockResponse = {
        success: false as const,
        error: 'Invalid credentials',
      }

      mockAxios.post.mockResolvedValue({ data: mockResponse } as any)

      await expect(
        authApi.login({ username: 'admin', password: 'wrong' }),
      ).rejects.toThrow('Invalid credentials')
    })
  })

  describe('getMe', () => {
    it('should return user info on successful request', async () => {
      const mockResponse = {
        success: true as const,
        data: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          name: '系统管理员',
          permissions: [],
        },
      }

      mockAxios.get.mockResolvedValue({ data: mockResponse } as any)

      const result = await authApi.getMe()

      expect(mockAxios.get).toHaveBeenCalledWith('/admin/me')
      expect(result.username).toBe('admin')
    })

    it('should throw error on failed request', async () => {
      const mockResponse = {
        success: false as const,
        error: 'Unauthorized',
      }

      mockAxios.get.mockResolvedValue({ data: mockResponse } as any)

      await expect(authApi.getMe()).rejects.toThrow('Unauthorized')
    })
  })
})