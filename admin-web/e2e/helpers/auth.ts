import { request } from '@playwright/test'

/**
 * 认证辅助函数
 * 用于在测试前获取认证token
 */
interface AuthCredentials {
  username: string
  password: string
}

interface AuthResponse {
  token: string
  user: {
    id: string
    username: string
    role: string
  }
}

export async function getAuthToken(
  baseURL: string,
  credentials: AuthCredentials
): Promise<string> {
  const context = await request.newContext()
  const response = await context.post(`${baseURL}/api/auth/login`, {
    data: credentials,
  })

  if (!response.ok()) {
    throw new Error(`认证失败: ${response.status()}`)
  }

  const data: AuthResponse = await response.json()
  return data.token
}

/**
 * 测试用户凭证
 * 优先从环境变量读取，便于 CI/CD 和安全配置
 */
export const TEST_USER: AuthCredentials = {
  username: process.env.TEST_USER_NAME || 'admin',
  password: process.env.TEST_USER_PASSWORD || 'admin123',
}