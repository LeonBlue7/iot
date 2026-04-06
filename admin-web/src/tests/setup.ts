import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.matchMedia for Ant Design
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock window.getComputedStyle for jsdom
const originalGetComputedStyle = window.getComputedStyle
window.getComputedStyle = vi.fn().mockImplementation((element: Element) => {
  return originalGetComputedStyle(element) || {
    getPropertyValue: vi.fn(),
    width: '0px',
    height: '0px',
  }
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock navigation
const originalLocation = window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    ...originalLocation,
    href: 'http://localhost/',
    pathname: '/',
    assign: vi.fn(),
    replace: vi.fn(),
  },
})

// Suppress axios interceptor navigation in tests
vi.mock('../utils/axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/axios').default>()
  return {
    default: {
      ...actual,
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn((successCallback, errorCallback) => {
            // Mock response interceptor - don't navigate on 401
            return 0
          }),
        },
      },
    },
  }
})