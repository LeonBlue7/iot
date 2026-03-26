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
 * 记住的凭证
 */
export interface RememberedCredentials {
  username: string;
  password: string;
}

/**
 * Token 存储键名
 */
const TOKEN_STORAGE_KEY = 'auth_token';
const USER_STORAGE_KEY = 'user_info';
const TOKEN_EXPIRY_KEY = 'token_expiry';
const REMEMBERED_CREDENTIALS_KEY = 'remembered_credentials';

// 简单的编码/解码函数（非加密，仅用于混淆）
function encode(str: string): string {
  return Buffer.from(str).toString('base64');
}

function decode(str: string): string {
  return Buffer.from(str, 'base64').toString('utf-8');
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

  // 存储 token 和用户信息
  wx.setStorageSync(TOKEN_STORAGE_KEY, result.data.token);
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
 * 获取存储的 token
 */
export function getToken(): string | null {
  try {
    const token = wx.getStorageSync(TOKEN_STORAGE_KEY);
    if (!token) {
      return null;
    }
    return token;
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

// ============================================
// 微信登录功能
// ============================================

/**
 * 微信登录响应
 */
export interface WechatLoginResponse {
  token: string;
  user: UserInfo;
}

/**
 * 微信登录
 * 使用 wx.login 获取 code，然后发送到后端验证
 */
export async function wechatLogin(code: string): Promise<WechatLoginResponse> {
  if (!code) {
    throw new Error('微信登录 code 不能为空');
  }

  const result = await request<WechatLoginResponse>('/admin/auth/wechat-login', 'POST', {
    code,
  });

  if (!result.success || !result.data) {
    throw new Error(result.error || '微信登录失败');
  }

  // 存储 token 和用户信息
  wx.setStorageSync(TOKEN_STORAGE_KEY, result.data.token);
  wx.setStorageSync(USER_STORAGE_KEY, result.data.user);

  // 计算过期时间（假设 token 有效期为 24 小时）
  const expiryTime = Date.now() + 24 * 60 * 60 * 1000;
  wx.setStorageSync(TOKEN_EXPIRY_KEY, expiryTime);

  return result.data;
}

// ============================================
// 记住密码功能
// ============================================

/**
 * 保存记住的凭证
 * 注意：密码以 base64 编码存储，不是加密，仅用于便利性
 */
export function saveRememberedCredentials(credentials: RememberedCredentials): void {
  const encoded = {
    username: encode(credentials.username),
    password: encode(credentials.password),
  };
  wx.setStorageSync(REMEMBERED_CREDENTIALS_KEY, JSON.stringify(encoded));
}

/**
 * 加载记住的凭证
 */
export function loadRememberedCredentials(): RememberedCredentials | null {
  try {
    const stored = wx.getStorageSync(REMEMBERED_CREDENTIALS_KEY);
    if (!stored) {
      return null;
    }

    const encoded = JSON.parse(stored);
    return {
      username: decode(encoded.username),
      password: decode(encoded.password),
    };
  } catch {
    return null;
  }
}

/**
 * 清除记住的凭证
 */
export function clearRememberedCredentials(): void {
  wx.removeStorageSync(REMEMBERED_CREDENTIALS_KEY);
}

/**
 * 检查是否有记住的凭证
 */
export function hasRememberedCredentials(): boolean {
  try {
    const stored = wx.getStorageSync(REMEMBERED_CREDENTIALS_KEY);
    return !!stored;
  } catch {
    return false;
  }
}

// ============================================
// 自动登录功能
// ============================================

/**
 * 自动登录
 * 使用记住的凭证进行登录
 */
export async function autoLogin(): Promise<LoginResponse> {
  const credentials = loadRememberedCredentials();
  if (!credentials) {
    throw new Error('没有保存的凭证');
  }

  return login(credentials);
}
