// miniprogram/utils/auth.ts
// 认证相关类型和函数

import { request } from './api';

/**
 * 登录请求参数
 */
export interface LoginParams {
  username: string;
  password: string;
}

/**
 * 登录响应数据
 */
export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    name: string | null;
    permissions: string[];
  };
}

/**
 * 用户信息
 */
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  name: string | null;
  permissions: string[];
}

/**
 * Token 存储键名
 */
const TOKEN_STORAGE_KEY = 'auth_token';
const USER_STORAGE_KEY = 'user_info';
const TOKEN_EXPIRY_KEY = 'token_expiry';

/**
 * 简单的 Base64 编码/解码（用于防止明文显示）
 * 注意：这不是加密，只是避免明文暴露
 */
function encodeToken(token: string): string {
  try {
    return wx.base64Encode(token);
  } catch {
    // 降级处理：直接返回（部分基础库可能不支持）
    return token;
  }
}

function decodeToken(encodedToken: string): string | null {
  try {
    return wx.base64Decode(encodedToken);
  } catch {
    // 降级处理：尝试直接使用原值
    return encodedToken;
  }
}

/**
 * 登录函数
 */
export async function login(params: LoginParams): Promise<LoginResponse> {
  // 验证输入
  if (!params.username || !params.password) {
    throw new Error('Username and password are required');
  }

  // 调用登录 API
  const result = await request<LoginResponse>('/admin/auth/login', 'POST', {
    username: params.username,
    password: params.password,
  });

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Login failed');
  }

  // 存储 token（编码后）和用户信息
  wx.setStorageSync(TOKEN_STORAGE_KEY, encodeToken(result.data.token));
  wx.setStorageSync(USER_STORAGE_KEY, result.data.user);

  // 计算过期时间（假设 token 有效期为 24 小时）
  const expiryTime = Date.now() + 24 * 60 * 60 * 1000;
  wx.setStorageSync(TOKEN_EXPIRY_KEY, expiryTime);

  return result.data;
}

/**
 * 登出函数
 */
export function logout(): void {
  wx.removeStorageSync(TOKEN_STORAGE_KEY);
  wx.removeStorageSync(USER_STORAGE_KEY);
  wx.removeStorageSync(TOKEN_EXPIRY_KEY);
}

/**
 * 获取存储的 token（解码后）
 */
export function getToken(): string | null {
  try {
    const encodedToken = wx.getStorageSync(TOKEN_STORAGE_KEY);
    if (!encodedToken) {
      return null;
    }
    return decodeToken(encodedToken);
  } catch {
    return null;
  }
}

/**
 * 检查 token 是否过期
 */
export function isTokenExpired(): boolean {
  try {
    const expiryTime = wx.getStorageSync(TOKEN_EXPIRY_KEY);
    if (!expiryTime) {
      return true;
    }
    return Date.now() > expiryTime;
  } catch {
    return true;
  }
}

/**
 * 获取存储的用户信息
 */
export function getUserInfo(): UserInfo | null {
  try {
    return wx.getStorageSync(USER_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * 检查是否已登录（包含 token 有效性检查）
 */
export function isLoggedIn(): boolean {
  const token = getToken();
  if (!token) {
    return false;
  }
  // 检查 token 是否过期
  if (isTokenExpired()) {
    logout();
    return false;
  }
  return true;
}
