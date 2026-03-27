import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '../Layout'
import { useAuth } from '../../hooks/useAuth'

// Mock useAuth
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

// Mock Ant Design - must define components inside the mock factory
vi.mock('antd', () => {
  const MockLayout = ({ children }: any) => <div data-testid="layout">{children}</div>
  MockLayout.Sider = ({ children, collapsed }: any) => (
    <div data-testid="sider" data-collapsed={String(collapsed)}>
      {children}
    </div>
  )
  MockLayout.Header = ({ children }: any) => <header data-testid="header">{children}</header>
  MockLayout.Content = ({ children }: any) => <main data-testid="content">{children}</main>

  const MockMenu = ({ items, onClick, selectedKeys }: any) => (
    <nav data-testid="menu" data-selected={selectedKeys?.[0]}>
      {items?.map((item: any) => (
        <button
          key={item.key}
          onClick={() => onClick?.({ key: item.key })}
          data-menu-item={item.key}
          data-selected={selectedKeys?.[0] === item.key}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )

  return {
    Layout: MockLayout,
    Menu: MockMenu,
    theme: {
      useToken: () => ({
        token: {
          colorBgContainer: '#fff',
          borderRadiusLG: 8,
        },
      }),
    },
  }
})

// Mock icons
vi.mock('@ant-design/icons', () => ({
  DashboardOutlined: () => <span data-testid="dashboard-icon" />,
  MobileOutlined: () => <span data-testid="mobile-icon" />,
  WarningOutlined: () => <span data-testid="warning-icon" />,
  BarChartOutlined: () => <span data-testid="chart-icon" />,
  MenuFoldOutlined: () => <span data-testid="fold-icon">Fold</span>,
  MenuUnfoldOutlined: () => <span data-testid="unfold-icon">Unfold</span>,
  LogoutOutlined: ({ onClick }: any) => (
    <button data-testid="logout-btn" onClick={onClick}>
      Logout
    </button>
  ),
  UserOutlined: () => <span data-testid="user-icon" />,
  FolderOutlined: () => <span data-testid="folder-icon" />,
}))

const mockUseAuth = vi.mocked(useAuth)
const mockLogout = vi.fn()

const renderWithRouter = (initialRoute = '/dashboard') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/*" element={<Layout />} />
        <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'admin', email: 'admin@example.com', name: 'Admin User', permissions: [] },
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: mockLogout,
      clearToken: vi.fn(),
    } as any)
  })

  describe('Sidebar menu rendering', () => {
    it('should render sidebar with menu items', () => {
      renderWithRouter()

      expect(screen.getByTestId('sider')).toBeInTheDocument()
      expect(screen.getByTestId('menu')).toBeInTheDocument()
    })

    it('should display all menu items correctly', () => {
      renderWithRouter()

      expect(screen.getByText('仪表盘')).toBeInTheDocument()
      expect(screen.getByText('设备管理')).toBeInTheDocument()
      expect(screen.getByText('分组管理')).toBeInTheDocument()
      expect(screen.getByText('告警管理')).toBeInTheDocument()
      expect(screen.getByText('统计分析')).toBeInTheDocument()
    })

    it('should display logo text', () => {
      renderWithRouter()

      expect(screen.getByText('物联网管理系统')).toBeInTheDocument()
    })

    it('should highlight current route in menu', () => {
      renderWithRouter('/devices')

      expect(screen.getByTestId('menu')).toHaveAttribute('data-selected', '/devices')
    })
  })

  describe('Menu navigation', () => {
    it('should navigate to dashboard when clicking dashboard menu item', () => {
      renderWithRouter('/devices')

      fireEvent.click(screen.getByText('仪表盘'))

      expect(screen.getByTestId('menu')).toHaveAttribute('data-selected', '/dashboard')
    })

    it('should navigate to devices when clicking devices menu item', () => {
      renderWithRouter('/dashboard')

      fireEvent.click(screen.getByText('设备管理'))

      expect(screen.getByTestId('menu')).toHaveAttribute('data-selected', '/devices')
    })

    it('should navigate to groups when clicking groups menu item', () => {
      renderWithRouter('/dashboard')

      fireEvent.click(screen.getByText('分组管理'))

      expect(screen.getByTestId('menu')).toHaveAttribute('data-selected', '/groups')
    })

    it('should navigate to alarms when clicking alarms menu item', () => {
      renderWithRouter('/dashboard')

      fireEvent.click(screen.getByText('告警管理'))

      expect(screen.getByTestId('menu')).toHaveAttribute('data-selected', '/alarms')
    })

    it('should navigate to stats when clicking stats menu item', () => {
      renderWithRouter('/dashboard')

      fireEvent.click(screen.getByText('统计分析'))

      expect(screen.getByTestId('menu')).toHaveAttribute('data-selected', '/stats')
    })
  })

  describe('User information display', () => {
    it('should display user name in header', () => {
      renderWithRouter()

      expect(screen.getByText('Admin User')).toBeInTheDocument()
    })

    it('should display username when user name is not available', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'testuser', email: 'test@example.com', name: null, permissions: [] },
        token: 'test-token',
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: mockLogout,
        clearToken: vi.fn(),
      } as any)

      renderWithRouter()

      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    it('should display username when user name is empty string', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'testuser', email: 'test@example.com', name: '', permissions: [] },
        token: 'test-token',
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: mockLogout,
        clearToken: vi.fn(),
      } as any)

      renderWithRouter()

      expect(screen.getByText('testuser')).toBeInTheDocument()
    })
  })

  describe('Logout functionality', () => {
    it('should call logout when clicking logout button', () => {
      renderWithRouter()

      fireEvent.click(screen.getByTestId('logout-btn'))

      expect(mockLogout).toHaveBeenCalled()
    })

    it('should navigate to login page after logout', () => {
      renderWithRouter()

      fireEvent.click(screen.getByTestId('logout-btn'))

      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  describe('Layout structure', () => {
    it('should render header', () => {
      renderWithRouter()

      expect(screen.getByTestId('header')).toBeInTheDocument()
    })

    it('should render content area', () => {
      renderWithRouter()

      expect(screen.getByTestId('content')).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('should handle null user gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: 'test-token',
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: mockLogout,
        clearToken: vi.fn(),
      } as any)

      expect(() => renderWithRouter()).not.toThrow()
    })

    it('should handle rapid menu clicks without errors', () => {
      renderWithRouter('/dashboard')

      expect(() => {
        fireEvent.click(screen.getByText('设备管理'))
        fireEvent.click(screen.getByText('分组管理'))
        fireEvent.click(screen.getByText('仪表盘'))
      }).not.toThrow()
    })
  })
})