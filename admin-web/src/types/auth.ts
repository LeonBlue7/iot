export interface LoginCredentials {
  username: string
  password: string
}

export interface UserInfo {
  id: number
  username: string
  email: string
  name: string
  permissions: string[]
}

export interface AuthState {
  token: string | null
  user: UserInfo | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  setToken: (token: string) => void
  clearToken: () => void
}
