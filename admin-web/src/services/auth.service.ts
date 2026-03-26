import axios from '../utils/axios'
import type { LoginCredentials, UserInfo } from '../types/auth'
import type { ApiResponse, ApiErrorResponse } from '../types/api'

export interface LoginResponse {
  token: string
  user: UserInfo
}

function getErrorMessage(response: ApiResponse<LoginResponse>): string {
  if (!response.success) {
    return (response as ApiErrorResponse).error || '操作失败'
  }
  return '操作失败'
}

export const authApi = {
  /**
   * 管理员登录
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axios.post<ApiResponse<LoginResponse>>(
      '/admin/auth/login',
      credentials,
    )

    if (!response.data.success) {
      throw new Error(getErrorMessage(response.data))
    }

    return response.data.data
  },

  /**
   * 获取当前用户信息
   */
  async getMe(): Promise<UserInfo> {
    const response = await axios.get<ApiResponse<UserInfo>>(
      '/admin/me',
    )

    if (!response.data.success) {
      throw new Error(getErrorMessage(response.data))
    }

    return response.data.data
  },
}
