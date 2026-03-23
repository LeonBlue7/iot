// miniprogram/utils/auth.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock wx 对象
const mockWx = {
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  removeStorageSync: jest.fn(),
};

// 在导入模块前设置 mock
(global as any).wx = mockWx;

import { login, logout, getToken, getUserInfo, isLoggedIn } from './auth';

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
    it('should return true when token exists', () => {
      mockWx.getStorageSync.mockReturnValue('valid-token');

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
  });
});
