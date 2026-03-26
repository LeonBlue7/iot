// miniprogram/utils/auth.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock wx 对象
const mockWx: any = {
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  removeStorageSync: jest.fn(),
};

// 在导入模块前设置 mock
(global as any).wx = mockWx;

// Mock request function
jest.mock('./api', () => ({
  request: jest.fn(),
}));

const mockRequest: any = require('./api').request;

import {
  login,
  logout,
  getToken,
  getUserInfo,
  isLoggedIn,
  wechatLogin,
  saveRememberedCredentials,
  loadRememberedCredentials,
  clearRememberedCredentials,
  hasRememberedCredentials,
  autoLogin,
} from './auth';

describe('Auth Utils - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getToken', () => {
    it('should return token from storage when exists', () => {
      mockWx.getStorageSync.mockReturnValue('test-token-123');

      const token = getToken();

      expect(token).toBe('test-token-123');
      expect(mockWx.getStorageSync).toHaveBeenCalledWith('auth_token');
    });

    it('should return null when token not in storage', () => {
      mockWx.getStorageSync.mockReturnValue(null);

      const token = getToken();

      expect(token).toBeNull();
      expect(mockWx.getStorageSync).toHaveBeenCalledWith('auth_token');
    });

    it('should return null when storage access throws error', () => {
      mockWx.getStorageSync.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const token = getToken();

      expect(token).toBeNull();
    });
  });

  describe('getUserInfo', () => {
    it('should return user info from storage when exists', () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        name: 'Admin',
        permissions: ['device:read', 'device:write'],
      };
      mockWx.getStorageSync.mockReturnValue(mockUser);

      const user = getUserInfo();

      expect(user).toEqual(mockUser);
      expect(mockWx.getStorageSync).toHaveBeenCalledWith('user_info');
    });

    it('should return null when user info not in storage', () => {
      mockWx.getStorageSync.mockReturnValue(null);

      const user = getUserInfo();

      expect(user).toBeNull();
      expect(mockWx.getStorageSync).toHaveBeenCalledWith('user_info');
    });

    it('should return null when storage access throws error', () => {
      mockWx.getStorageSync.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const user = getUserInfo();

      expect(user).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('should return true when token exists and not expired', () => {
      mockWx.getStorageSync.mockImplementation((key: string) => {
        if (key === 'auth_token') return 'valid-token';
        if (key === 'token_expiry') return Date.now() + 10000;
        return null;
      });

      const result = isLoggedIn();

      expect(result).toBe(true);
    });

    it('should return false when token is null', () => {
      mockWx.getStorageSync.mockReturnValue(null);

      const result = isLoggedIn();

      expect(result).toBe(false);
    });

    it('should return false when token is empty string', () => {
      mockWx.getStorageSync.mockReturnValue('');

      const result = isLoggedIn();

      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('should remove token and user info from storage', () => {
      logout();

      expect(mockWx.removeStorageSync).toHaveBeenCalledWith('auth_token');
      expect(mockWx.removeStorageSync).toHaveBeenCalledWith('user_info');
    });
  });

  describe('login', () => {
    it('should reject when username is empty', async () => {
      const params = { username: '', password: 'password123' };

      await expect(login(params)).rejects.toThrow();
    });

    it('should reject when password is empty', async () => {
      const params = { username: 'admin', password: '' };

      await expect(login(params)).rejects.toThrow();
    });

    it('should reject when both username and password are empty', async () => {
      const params = { username: '', password: '' };

      await expect(login(params)).rejects.toThrow();
    });

    it('should return login response on success', async () => {
      const mockResponse = {
        token: 'test-token-123',
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          name: 'Admin',
          permissions: ['*'],
        },
      };

      mockRequest.mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      const result = await login({ username: 'admin', password: 'password123' });

      expect(result).toEqual(mockResponse);
      expect(mockWx.setStorageSync).toHaveBeenCalledWith('auth_token', 'test-token-123');
    });

    it('should throw error when API returns failure', async () => {
      mockRequest.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      await expect(login({ username: 'admin', password: 'wrong' })).rejects.toThrow('Invalid credentials');
    });
  });

  // ============================================
  // NEW TESTS: 微信登录功能
  // ============================================
  describe('wechatLogin', () => {
    it('should throw error when code is empty', async () => {
      await expect(wechatLogin('')).rejects.toThrow('微信登录 code 不能为空');
    });

    it('should return login response on success', async () => {
      const mockResponse = {
        token: 'wechat-token-123',
        user: {
          id: 1,
          username: 'wechat_user',
          email: 'wechat@example.com',
          name: 'WeChat User',
          permissions: ['*'],
        },
      };

      mockRequest.mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      const result = await wechatLogin('wechat-code-123');

      expect(result).toEqual(mockResponse);
      expect(mockWx.setStorageSync).toHaveBeenCalledWith('auth_token', 'wechat-token-123');
    });

    it('should throw error when API returns failure', async () => {
      mockRequest.mockResolvedValue({
        success: false,
        error: 'WeChat auth failed',
      });

      await expect(wechatLogin('wechat-code-123')).rejects.toThrow('WeChat auth failed');
    });
  });

  // ============================================
  // NEW TESTS: 记住密码功能
  // ============================================
  describe('saveRememberedCredentials', () => {
    it('should save credentials to storage', () => {
      saveRememberedCredentials({ username: 'admin', password: 'password123' });

      expect(mockWx.setStorageSync).toHaveBeenCalledWith(
        'remembered_credentials',
        expect.any(String)
      );
    });
  });

  describe('loadRememberedCredentials', () => {
    it('should return credentials when exists', () => {
      // 先保存凭证
      saveRememberedCredentials({ username: 'testuser', password: 'testpass' });

      // 然后加载
      mockWx.getStorageSync.mockReturnValue(
        JSON.stringify({
          username: Buffer.from('testuser').toString('base64'),
          password: Buffer.from('testpass').toString('base64'),
        })
      );

      const credentials = loadRememberedCredentials();

      expect(credentials).toEqual({
        username: 'testuser',
        password: 'testpass',
      });
    });

    it('should return null when no credentials stored', () => {
      mockWx.getStorageSync.mockReturnValue(null);

      const credentials = loadRememberedCredentials();

      expect(credentials).toBeNull();
    });

    it('should return null when storage throws error', () => {
      mockWx.getStorageSync.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const credentials = loadRememberedCredentials();

      expect(credentials).toBeNull();
    });
  });

  describe('clearRememberedCredentials', () => {
    it('should remove credentials from storage', () => {
      clearRememberedCredentials();

      expect(mockWx.removeStorageSync).toHaveBeenCalledWith('remembered_credentials');
    });
  });

  describe('hasRememberedCredentials', () => {
    it('should return true when credentials exist', () => {
      mockWx.getStorageSync.mockReturnValue(JSON.stringify({ username: 'dGVzdA==', password: 'dGVzdA==' }));

      const result = hasRememberedCredentials();

      expect(result).toBe(true);
    });

    it('should return false when no credentials stored', () => {
      mockWx.getStorageSync.mockReturnValue(null);

      const result = hasRememberedCredentials();

      expect(result).toBe(false);
    });

    it('should return false when storage throws error', () => {
      mockWx.getStorageSync.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = hasRememberedCredentials();

      expect(result).toBe(false);
    });
  });

  // ============================================
  // NEW TESTS: 自动登录功能
  // ============================================
  describe('autoLogin', () => {
    it('should throw error when no saved credentials', async () => {
      mockWx.getStorageSync.mockReturnValue(null);

      await expect(autoLogin()).rejects.toThrow('没有保存的凭证');
    });

    it('should login with saved credentials', async () => {
      const mockResponse = {
        token: 'auto-token-123',
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          name: 'Admin',
          permissions: ['*'],
        },
      };

      mockWx.getStorageSync.mockImplementation((key: string) => {
        if (key === 'remembered_credentials') {
          return JSON.stringify({
            username: Buffer.from('admin').toString('base64'),
            password: Buffer.from('password123').toString('base64'),
          });
        }
        return null;
      });

      mockRequest.mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      const result = await autoLogin();

      expect(result).toEqual(mockResponse);
    });
  });
});