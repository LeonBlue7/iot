import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { message } from 'antd'
import Login from '../Login'
import { useAuth } from '../../hooks/useAuth'

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }
})

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

describe('Login', () => {
  const mockLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      logout: vi.fn(),
      clearToken: vi.fn(),
    })
  })

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
  }

  it('should render login form', () => {
    renderLogin()

    expect(screen.getByPlaceholderText('用户名')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('密码')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /登/i })).toBeInTheDocument()
    expect(screen.getByText('物联网管理系统')).toBeInTheDocument()
  })

  it('should call login with credentials on form submit', async () => {
    mockLogin.mockResolvedValue(undefined)
    renderLogin()

    fireEvent.change(screen.getByPlaceholderText('用户名'), {
      target: { value: 'admin' },
    })
    fireEvent.change(screen.getByPlaceholderText('密码'), {
      target: { value: 'admin123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /登/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'admin',
        password: 'admin123',
      })
    })
  })

  it('should show success message and navigate on successful login', async () => {
    mockLogin.mockResolvedValue(undefined)
    renderLogin()

    fireEvent.change(screen.getByPlaceholderText('用户名'), {
      target: { value: 'admin' },
    })
    fireEvent.change(screen.getByPlaceholderText('密码'), {
      target: { value: 'admin123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /登/i }))

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('登录成功')
    })
  })

  it('should show error message on failed login', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'))
    renderLogin()

    fireEvent.change(screen.getByPlaceholderText('用户名'), {
      target: { value: 'admin' },
    })
    fireEvent.change(screen.getByPlaceholderText('密码'), {
      target: { value: 'wrong' },
    })
    fireEvent.click(screen.getByRole('button', { name: /登/i }))

    await waitFor(() => {
      expect(message.error).toHaveBeenCalled()
    })
  })

  it('should require username field', async () => {
    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: /登/i }))

    await waitFor(() => {
      expect(screen.getByText('请输入用户名')).toBeInTheDocument()
    })
  })

  it('should require password field', async () => {
    renderLogin()

    fireEvent.change(screen.getByPlaceholderText('用户名'), {
      target: { value: 'admin' },
    })
    fireEvent.click(screen.getByRole('button', { name: /登/i }))

    await waitFor(() => {
      expect(screen.getByText('请输入密码')).toBeInTheDocument()
    })
  })
})
