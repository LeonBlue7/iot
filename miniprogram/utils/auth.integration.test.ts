// miniprogram/utils/auth.integration.test.ts
// Integration tests for auth module with API mocking

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock wx object
const mockWx = {
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  removeStorageSync: jest.fn(),
};

(global as any).wx = mockWx;

// Mock the API module before importing auth
const mockRequest = jest.fn();
jest.mock('./api', () => ({
  request: mockRequest,
}));

// Import auth after mocking
import { login } from './auth';

describe('Auth Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login - API integration', () => {
    it('should successfully login and store token and user info', async () => {
      const mockResponse = {
        token: 'jwt-token-123',
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          name: 'Admin User',
          permissions: ['*'],
        },
      };

      mockRequest.mockImplementation(() =>
        Promise.resolve({
          success: true,
          data: mockResponse,
        })
      );

      const result = await login({ username: 'admin', password: 'password123' });

      expect(result).toEqual(mockResponse);
      expect(mockRequest).toHaveBeenCalledWith(
        '/admin/auth/login',
        'POST',
        { username: 'admin', password: 'password123' }
      );
      expect(mockWx.setStorageSync).toHaveBeenCalledWith('auth_token', 'jwt-token-123');
      expect(mockWx.setStorageSync).toHaveBeenCalledWith('user_info', mockResponse.user);
    });

    it('should reject when API returns success=false with error message', async () => {
      mockRequest.mockImplementation(() =>
        Promise.resolve({
          success: false,
          error: 'Invalid credentials',
        })
      );

      await expect(
        login({ username: 'admin', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should reject with default message when API fails without error', async () => {
      mockRequest.mockImplementation(() =>
        Promise.resolve({
          success: false,
          error: null,
        })
      );

      await expect(
        login({ username: 'admin', password: 'wrong' })
      ).rejects.toThrow('Login failed');
    });

    it('should reject when API call throws network error', async () => {
      mockRequest.mockImplementation(() => Promise.reject(new Error('Network error')));

      await expect(
        login({ username: 'admin', password: 'password123' })
      ).rejects.toThrow('Network error');
    });
  });
});
