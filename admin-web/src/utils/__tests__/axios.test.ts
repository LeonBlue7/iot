import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock axios before importing the module
const mockAxiosCreate = vi.fn()
const mockRequestInterceptor = {
  use: vi.fn(),
}
const mockResponseInterceptor = {
  use: vi.fn(),
}

vi.mock('axios', () => ({
  default: {
    create: mockAxiosCreate,
  },
}))

// Store interceptor callbacks
let requestSuccessCallback: (config: any) => any
let requestErrorCallback: (error: any) => any
let responseSuccessCallback: (response: any) => any
let responseErrorCallback: (error: any) => any

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get store() {
      return store
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock window.location
const mockLocation = {
  href: '',
  pathname: '/',
  assign: vi.fn(),
  reload: vi.fn(),
  replace: vi.fn(),
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

describe('axios instance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockLocation.href = ''
    mockLocation.pathname = '/'

    // Reset the mock axios instance
    mockAxiosCreate.mockReturnValue({
      interceptors: {
        request: mockRequestInterceptor,
        response: mockResponseInterceptor,
      },
      defaults: {
        baseURL: '/api',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    })

    // Capture interceptor callbacks
    mockRequestInterceptor.use.mockImplementation((success, error) => {
      requestSuccessCallback = success
      requestErrorCallback = error
    })

    mockResponseInterceptor.use.mockImplementation((success, error) => {
      responseSuccessCallback = success
      responseErrorCallback = error
    })
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('axios instance creation', () => {
    it('should create axios instance with correct configuration', async () => {
      // Import the module to trigger axios.create
      await import('../axios')

      expect(mockAxiosCreate).toHaveBeenCalledWith({
        baseURL: expect.any(String),
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })

    it('should use /api as default baseURL when VITE_API_BASE_URL is not set', async () => {
      await import('../axios')

      const createCall = mockAxiosCreate.mock.calls[0][0]
      expect(createCall.baseURL).toBe('/api')
    })
  })

  describe('request interceptor', () => {
    beforeEach(async () => {
      // Import module to register interceptors
      await import('../axios')
    })

    it('should not add Authorization header when no token in localStorage', () => {
      const config = { headers: {} }

      const result = requestSuccessCallback(config)

      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should not add Authorization header when auth-storage is null', () => {
      const config = { headers: {} }

      const result = requestSuccessCallback(config)

      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should add Authorization header when token exists in localStorage', () => {
      // Setup localStorage with valid auth data
      const authData = {
        state: {
          token: 'test-jwt-token-12345',
          user: { id: 1, username: 'admin' },
        },
      }
      localStorageMock.setItem('auth-storage', JSON.stringify(authData))

      const config = { headers: {} }

      const result = requestSuccessCallback(config)

      expect(result.headers.Authorization).toBe('Bearer test-jwt-token-12345')
    })

    it('should not crash when localStorage contains invalid JSON', () => {
      localStorageMock.setItem('auth-storage', 'invalid-json{')

      const config = { headers: {} }

      // Should not throw and should return config unchanged
      expect(() => requestSuccessCallback(config)).not.toThrow()
      const result = requestSuccessCallback(config)
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should not crash when parsed JSON does not have expected structure', () => {
      localStorageMock.setItem('auth-storage', JSON.stringify({ foo: 'bar' }))

      const config = { headers: {} }

      expect(() => requestSuccessCallback(config)).not.toThrow()
      const result = requestSuccessCallback(config)
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should not crash when state exists but token is null', () => {
      localStorageMock.setItem(
        'auth-storage',
        JSON.stringify({ state: { token: null } })
      )

      const config = { headers: {} }

      expect(() => requestSuccessCallback(config)).not.toThrow()
      const result = requestSuccessCallback(config)
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should not crash when state exists but token is undefined', () => {
      localStorageMock.setItem(
        'auth-storage',
        JSON.stringify({ state: { token: undefined } })
      )

      const config = { headers: {} }

      expect(() => requestSuccessCallback(config)).not.toThrow()
      const result = requestSuccessCallback(config)
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should not crash when state exists but token is empty string', () => {
      localStorageMock.setItem(
        'auth-storage',
        JSON.stringify({ state: { token: '' } })
      )

      const config = { headers: {} }

      expect(() => requestSuccessCallback(config)).not.toThrow()
      const result = requestSuccessCallback(config)
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should preserve existing headers when adding Authorization', () => {
      localStorageMock.setItem(
        'auth-storage',
        JSON.stringify({ state: { token: 'my-token' } })
      )

      const config = {
        headers: {
          'X-Custom-Header': 'custom-value',
          'Content-Type': 'application/json',
        },
      }

      const result = requestSuccessCallback(config)

      expect(result.headers.Authorization).toBe('Bearer my-token')
      expect(result.headers['X-Custom-Header']).toBe('custom-value')
      expect(result.headers['Content-Type']).toBe('application/json')
    })

    it('should return config unchanged when localStorage throws error', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('localStorage error')
      })

      const config = { headers: {} }

      // Should throw because the interceptor doesn't catch localStorage errors
      expect(() => requestSuccessCallback(config)).toThrow('localStorage error')
    })

    it('should reject promise on request error', async () => {
      const error = new Error('Request setup error')

      await expect(requestErrorCallback(error)).rejects.toThrow('Request setup error')
    })
  })

  describe('response interceptor', () => {
    beforeEach(async () => {
      await import('../axios')
    })

    it('should return response directly on success', () => {
      const response = {
        data: { message: 'success' },
        status: 200,
        statusText: 'OK',
      }

      const result = responseSuccessCallback(response)

      expect(result).toBe(response)
    })

    it('should return response with data on success', () => {
      const response = {
        data: { id: 1, name: 'test' },
        status: 200,
        statusText: 'OK',
        headers: {},
      }

      const result = responseSuccessCallback(response)

      expect(result.data).toEqual({ id: 1, name: 'test' })
      expect(result.status).toBe(200)
    })

    it('should clear localStorage and redirect to login on 401 error', async () => {
      localStorageMock.setItem('auth-storage', JSON.stringify({ state: { token: 'expired-token' } }))
      mockLocation.pathname = '/dashboard'

      const error = {
        response: { status: 401 },
      }

      await expect(responseErrorCallback(error)).rejects.toBeDefined()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth-storage')
      expect(mockLocation.href).toBe('/login')
    })

    it('should not redirect if already on login page on 401 error', async () => {
      localStorageMock.setItem('auth-storage', JSON.stringify({ state: { token: 'expired-token' } }))
      mockLocation.pathname = '/login'

      const error = {
        response: { status: 401 },
      }

      await expect(responseErrorCallback(error)).rejects.toBeDefined()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth-storage')
      expect(mockLocation.href).toBe('') // Should not change
    })

    it('should reject error for non-401 status codes', async () => {
      const error403 = {
        response: { status: 403, data: { message: 'Forbidden' } },
      }

      await expect(responseErrorCallback(error403)).rejects.toBeDefined()
      expect(localStorageMock.removeItem).not.toHaveBeenCalled()
      expect(mockLocation.href).toBe('')
    })

    it('should reject error for 500 status code', async () => {
      const error500 = {
        response: { status: 500, data: { message: 'Internal Server Error' } },
      }

      await expect(responseErrorCallback(error500)).rejects.toBeDefined()
      expect(localStorageMock.removeItem).not.toHaveBeenCalled()
    })

    it('should reject error for 404 status code', async () => {
      const error404 = {
        response: { status: 404, data: { message: 'Not Found' } },
      }

      await expect(responseErrorCallback(error404)).rejects.toBeDefined()
      expect(localStorageMock.removeItem).not.toHaveBeenCalled()
    })

    it('should handle error without response property', async () => {
      const networkError = new Error('Network Error')

      await expect(responseErrorCallback(networkError)).rejects.toThrow('Network Error')
      expect(localStorageMock.removeItem).not.toHaveBeenCalled()
    })

    it('should handle error with undefined response', async () => {
      const error = {
        message: 'timeout',
        response: undefined,
      }

      await expect(responseErrorCallback(error)).rejects.toBeDefined()
      expect(localStorageMock.removeItem).not.toHaveBeenCalled()
    })

    it('should handle error with null response', async () => {
      const error = {
        message: 'request failed',
        response: null,
      }

      await expect(responseErrorCallback(error)).rejects.toBeDefined()
      expect(localStorageMock.removeItem).not.toHaveBeenCalled()
    })

    it('should propagate error if localStorage.removeItem throws on 401', async () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('removeItem failed')
      })
      mockLocation.pathname = '/dashboard'

      const error = {
        response: { status: 401 },
      }

      // When localStorage.removeItem throws synchronously,
      // the interceptor function throws synchronously (not a rejected promise)
      expect(() => responseErrorCallback(error)).toThrow('removeItem failed')
    })

    it('should handle 401 error without existing auth-storage', async () => {
      mockLocation.pathname = '/dashboard'

      const error = {
        response: { status: 401 },
      }

      await expect(responseErrorCallback(error)).rejects.toBeDefined()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth-storage')
      expect(mockLocation.href).toBe('/login')
    })
  })
})