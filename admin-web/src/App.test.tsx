import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet } from 'react-router-dom'
import App from './App'
import { useAuthStore } from './store/authStore'

// Mock useAuthStore - this will be hoisted
vi.mock('./store/authStore', () => ({
  useAuthStore: vi.fn(),
}))

// Mock page components
vi.mock('./pages/Login', () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}))

vi.mock('./pages/Dashboard', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>,
}))

vi.mock('./pages/Devices', () => ({
  default: () => <div data-testid="devices-page">Devices Page</div>,
}))

vi.mock('./pages/Groups', () => ({
  default: () => <div data-testid="groups-page">Groups Page</div>,
}))

vi.mock('./pages/Alarms', () => ({
  default: () => <div data-testid="alarms-page">Alarms Page</div>,
}))

vi.mock('./pages/Stats', () => ({
  default: () => <div data-testid="stats-page">Stats Page</div>,
}))

// Mock AuthGuard - simplified without dynamic require
vi.mock('./components/AuthGuard', () => ({
  AuthGuard: ({ children }: { children: React.ReactNode }) => {
    // Return children directly for testing purposes
    // The authentication state is controlled by the test setup
    return <>{children}</>
  },
}))

// Mock Layout with Outlet
vi.mock('./components/Layout', () => ({
  Layout: () => (
    <div data-testid="layout">
      <Outlet />
    </div>
  ),
}))

const mockUseAuthStore = vi.mocked(useAuthStore)

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default to authenticated state
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
  })

  describe('Route configuration', () => {
    it('should render login page at /login route', () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    it('should render dashboard page at /dashboard route', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      )

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    })

    it('should render devices page at /devices route', () => {
      render(
        <MemoryRouter initialEntries={['/devices']}>
          <App />
        </MemoryRouter>
      )

      expect(screen.getByTestId('devices-page')).toBeInTheDocument()
    })

    it('should render groups page at /groups route', () => {
      render(
        <MemoryRouter initialEntries={['/groups']}>
          <App />
        </MemoryRouter>
      )

      expect(screen.getByTestId('groups-page')).toBeInTheDocument()
    })

    it('should render alarms page at /alarms route', () => {
      render(
        <MemoryRouter initialEntries={['/alarms']}>
          <App />
        </MemoryRouter>
      )

      expect(screen.getByTestId('alarms-page')).toBeInTheDocument()
    })

    it('should render stats page at /stats route', () => {
      render(
        <MemoryRouter initialEntries={['/stats']}>
          <App />
        </MemoryRouter>
      )

      expect(screen.getByTestId('stats-page')).toBeInTheDocument()
    })

    it('should redirect root path to /dashboard', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      )

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    })
  })

  describe('404 routing', () => {
    it('should redirect unknown routes to root (which redirects to dashboard)', () => {
      render(
        <MemoryRouter initialEntries={['/nonexistent-route']}>
          <App />
        </MemoryRouter>
      )

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    })
  })

  describe('Authentication routing', () => {
    it('should render protected routes when authenticated', () => {
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
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      )

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    })
  })
})