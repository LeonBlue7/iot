// miniprogram/pages/login/login.test.ts
/// <reference types="jest" />

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock Page function
const mockPageRegistration = jest.fn();
(global as any).Page = mockPageRegistration;

// 模拟 wx 对象
const mockWx: any = {
  navigateBack: jest.fn(),
  switchTab: jest.fn(),
  setStorageSync: jest.fn(),
  getStorageSync: jest.fn(),
  showToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
};

// 模拟 auth 模块
jest.mock('../../utils/auth', () => ({
  login: jest.fn(),
  getUserInfo: jest.fn(),
}));

(global as any).wx = mockWx;

const { login } = require('../../utils/auth');
const { formSubmit } = require('./login');

describe('Login Page - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWx.navigateBack.mockClear();
    mockWx.switchTab.mockClear();
    mockWx.showToast.mockClear();
    mockWx.showLoading.mockClear();
    mockWx.hideLoading.mockClear();
    mockWx.getStorageSync.mockClear();
    mockPageRegistration.mockClear();
  });

  describe('Page lifecycle', () => {
    it('should call navigateBack if user is already logged in on load', () => {
      // Mock that user info exists in storage
      mockWx.getStorageSync.mockReturnValue({ id: 1, username: 'admin' });

      // Re-import to trigger Page registration
      jest.resetModules();
      require('./login');

      // Get the Page registration call
      const pageConfig = mockPageRegistration.mock.calls[0][0];

      // Call onLoad
      pageConfig.onLoad();

      expect(mockWx.getStorageSync).toHaveBeenCalledWith('user_info');
      expect(mockWx.navigateBack).toHaveBeenCalled();
    });

    it('should not navigate if user is not logged in on load', () => {
      // Mock that no user info in storage
      mockWx.getStorageSync.mockReturnValue(null);

      jest.resetModules();
      require('./login');

      const pageConfig = mockPageRegistration.mock.calls[0][0];
      pageConfig.onLoad();

      expect(mockWx.navigateBack).not.toHaveBeenCalled();
    });
  });

  describe('Input handlers', () => {
    it('should update username when user types', () => {
      jest.resetModules();
      require('./login');

      const pageConfig = mockPageRegistration.mock.calls[0][0];
      const mockThis = {
        setData: jest.fn(),
      };

      pageConfig.onUsernameInput.call(mockThis, {
        detail: { value: 'testuser' },
      });

      expect(mockThis.setData).toHaveBeenCalledWith({ username: 'testuser' });
    });

    it('should update password when user types', () => {
      jest.resetModules();
      require('./login');

      const pageConfig = mockPageRegistration.mock.calls[0][0];
      const mockThis = {
        setData: jest.fn(),
      };

      pageConfig.onPasswordInput.call(mockThis, {
        detail: { value: 'secretpassword' },
      });

      expect(mockThis.setData).toHaveBeenCalledWith({ password: 'secretpassword' });
    });
  });

  describe('formSubmit', () => {
    it('should show error when username is empty', async () => {
      const event = {
        detail: {
          value: {
            username: '',
            password: 'password123',
          },
        },
      };

      await formSubmit(event as any);

      expect(mockWx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('用户名'),
          icon: 'none',
        })
      );
      expect(login).not.toHaveBeenCalled();
    });

    it('should show error when password is empty', async () => {
      const event = {
        detail: {
          value: {
            username: 'admin',
            password: '',
          },
        },
      };

      await formSubmit(event as any);

      expect(mockWx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('密码'),
          icon: 'none',
        })
      );
      expect(login).not.toHaveBeenCalled();
    });

    it('should call login API with correct credentials', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        name: 'Admin',
        permissions: ['*'],
      };

      login.mockResolvedValue({
        token: 'test-token-123',
        user: mockUser,
      });

      const event = {
        detail: {
          value: {
            username: 'admin',
            password: 'password123',
          },
        },
      };

      await formSubmit(event as any);

      expect(login).toHaveBeenCalledWith({
        username: 'admin',
        password: 'password123',
      });
      expect(mockWx.hideLoading).toHaveBeenCalled();
    });

    it('should show success message and redirect on successful login', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        name: 'Admin',
        permissions: ['*'],
      };

      login.mockResolvedValue({
        token: 'test-token-123',
        user: mockUser,
      });

      const event = {
        detail: {
          value: {
            username: 'admin',
            password: 'password123',
          },
        },
      };

      await formSubmit(event as any);

      expect(mockWx.setStorageSync).toHaveBeenCalledWith('auth_token', 'test-token-123');
      expect(mockWx.setStorageSync).toHaveBeenCalledWith('user_info', mockUser);
      expect(mockWx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '登录成功',
          icon: 'success',
        })
      );

      // 前进 timers 来触发 setTimeout
      jest.advanceTimersByTime(1000);
      expect(mockWx.switchTab).toHaveBeenCalled();
    });

    it('should show error message on login failure', async () => {
      login.mockRejectedValue(new Error('Invalid credentials'));

      const event = {
        detail: {
          value: {
            username: 'admin',
            password: 'wrongpassword',
          },
        },
      };

      await formSubmit(event as any);

      expect(mockWx.hideLoading).toHaveBeenCalled();
      expect(mockWx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('登录失败'),
          icon: 'none',
        })
      );
    });
  });
});
