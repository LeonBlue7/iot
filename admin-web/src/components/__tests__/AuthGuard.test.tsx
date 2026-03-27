import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthGuard } from '../AuthGuard'
import { useAuthStore } from '../../store/authStore'

// Mock useAuthStore
vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}))

// Mock Ant Design Spin component
vi.mock('antd', () => ({
  Spin: ({ tip }: { tip: string }) => <div data-testid="spin">{tip}</div>,
}))

const mockUseAuthStore = vi.mocked(useAuthStore)

const renderWithRouter = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route
          path="/"
          element={
            <AuthGuard>
              <div data-testid="protected-content">Protected Content</div>
            </AuthGuard>
          }
        />
        <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading state', () => {
    it('should show loading spinner when isLoading is true', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        token: null,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        setToken: vi.fn(),
        clearToken: vi.fn(),
      } as any)

      renderWithRouter()

      expect(screen.getByTestId('spin')).toBeInTheDocument()
      expect(screen.getByText('加载中...')).toBeInTheDocument()
    })

    it('should not render protected content while loading', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        isLoading: true,
        token: 'test-token',
        user: { id: 1, username: 'admin', email: 'admin@example.com', name: 'Admin', permissions: [] },
        login: vi.fn(),
        logout: vi.fn(),
        setToken: vi.fn(),
        clearToken: vi.fn(),
      } as any)

      renderWithRouter()

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
      expect(screen.getByTestId('spin')).toBeInTheDocument()
    })
  })

  describe('Unauthenticated state', () => {
    it('should redirect to login page when not authenticated', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        token: null,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        setToken: vi.fn(),
        clearToken: vi.fn(),
      } as any)

      renderWithRouter()

      expect(screen.getByTestId('login-page')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should redirect to login when token is null but user exists', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        token: null,
        user: { id: 1, username: 'admin', email: 'admin@example.com', name: 'Admin', permissions: [] },
        login: vi.fn(),
        logout: vi.fn(),
        setToken: vi.fn(),
        clearToken: vi.fn(),
      } as any)

      renderWithRouter()

      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  describe('Authenticated state', () => {
    it('should render children when authenticated', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        token: 'test-token',
        user: { id: 1, username: 'admin', email: 'admin@example.com', name: 'Admin', permissions: [] },
        login: vi.fn(),
        logout: vi.fn(),
        setToken: vi.fn(),
        clearToken: vi.fn(),
      } as any)

      renderWithRouter()

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
    })

    it('should render children with token but no user data', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        token: 'test-token',
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        setToken: vi.fn(),
        clearToken: vi.fn(),
      } as any)

      renderWithRouter()

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('should render multiple children elements', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        token: 'test-token',
        user: { id: 1, username: 'admin', email: 'admin@example.com', name: 'Admin', permissions: [] },
        login: vi.fn(),
        logout: vi.fn(),
        setToken: vi.fn(),
        clearToken: vi.fn(),
      } as any)

      render(
        <MemoryRouter>
          <AuthGuard>
            <div data-testid="child-1">Child 1</div>
            <div data-testid="child-2">Child 2</div>
          </AuthGuard>
        </MemoryRouter>
      )

      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
    })
  })
})