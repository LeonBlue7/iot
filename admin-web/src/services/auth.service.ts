import axios from 'axios'
import type { LoginCredentials, UserInfo } from '../types/auth'
import type { ApiResponse } from '../types/api'

const API_BASE_URL = '/api'

export interface LoginResponse {
  token: string
  user: UserInfo
}

export const authApi = {
  /**
   * 管理员登录
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axios.post<ApiResponse<LoginResponse>>(
      `${API_BASE_URL}/admin/auth/login`,
      credentials,
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '登录失败')
    }

    return response.data.data
  },

  /**
   * 获取当前用户信息
   */
  async getMe(): Promise<UserInfo> {
    const response = await axios.get<ApiResponse<UserInfo>>(
      `${API_BASE_URL}/admin/me`,
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取用户信息失败')
    }

    return response.data.data
  },
}
