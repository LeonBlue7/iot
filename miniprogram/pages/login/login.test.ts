// miniprogram/pages/login/login.test.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock Page function
const mockPageRegistration = jest.fn();
(global as any).Page = mockPageRegistration;

// 模拟 wx 对象
const mockWx: any = {
  navigateBack: jest.fn(),
  switchTab: jest.fn(),
  setStorageSync: jest.fn(),
  getStorageSync: jest.fn(),
  removeStorageSync: jest.fn(),
  showToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  login: jest.fn(),
};

(global as any).wx = mockWx;

// 模拟 auth 模块函数
const mockLogin: any = jest.fn();
const mockWechatLogin: any = jest.fn();
const mockSaveRememberedCredentials: any = jest.fn();
const mockLoadRememberedCredentials: any = jest.fn();
const mockClearRememberedCredentials: any = jest.fn();
const mockHasRememberedCredentials: any = jest.fn();
const mockAutoLogin: any = jest.fn();

jest.mock('../../utils/auth', () => ({
  login: mockLogin,
  getUserInfo: jest.fn(),
  wechatLogin: mockWechatLogin,
  saveRememberedCredentials: mockSaveRememberedCredentials,
  loadRememberedCredentials: mockLoadRememberedCredentials,
  clearRememberedCredentials: mockClearRememberedCredentials,
  hasRememberedCredentials: mockHasRememberedCredentials,
  autoLogin: mockAutoLogin,
}));

// 获取 Page 注册调用的配置（带类型）
function getPageConfig(): Record<string, any> {
  return mockPageRegistration.mock.calls[0]?.[0] || {};
}

const { formSubmit, handleWechatLogin, handleRememberPassword, loadSavedCredentials } = require('./login');

describe('Login Page - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPageRegistration.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Page lifecycle', () => {
    it('should call navigateBack if user is already logged in on load', () => {
      mockWx.getStorageSync.mockReturnValue({ id: 1, username: 'admin' });

      jest.resetModules();
      require('./login');

      const pageConfig = getPageConfig();
      pageConfig.onLoad();

      expect(mockWx.getStorageSync).toHaveBeenCalledWith('user_info');
      expect(mockWx.navigateBack).toHaveBeenCalled();
    });

    it('should not navigate if user is not logged in on load', () => {
      mockWx.getStorageSync.mockReturnValue(null);

      jest.resetModules();
      require('./login');

      const pageConfig = getPageConfig();
      pageConfig.onLoad();

      expect(mockWx.navigateBack).not.toHaveBeenCalled();
    });
  });

  describe('Input handlers', () => {
    it('should update username when user types', () => {
      jest.resetModules();
      require('./login');

      const pageConfig = getPageConfig();
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

      const pageConfig = getPageConfig();
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

      await formSubmit(event);

      expect(mockWx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('用户名'),
          icon: 'none',
        })
      );
      expect(mockLogin).not.toHaveBeenCalled();
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

      await formSubmit(event);

      expect(mockWx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('密码'),
          icon: 'none',
        })
      );
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should call login API with correct credentials', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        name: 'Admin',
        permissions: ['*'],
      };

      mockLogin.mockResolvedValue({
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

      await formSubmit(event);

      expect(mockLogin).toHaveBeenCalledWith({
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

      mockLogin.mockResolvedValue({
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

      await formSubmit(event);

      expect(mockWx.setStorageSync).toHaveBeenCalledWith('auth_token', 'test-token-123');
      expect(mockWx.setStorageSync).toHaveBeenCalledWith('user_info', mockUser);
      expect(mockWx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '登录成功',
          icon: 'success',
        })
      );

      jest.advanceTimersByTime(1000);
      expect(mockWx.switchTab).toHaveBeenCalled();
    });

    it('should show error message on login failure', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));

      const event = {
        detail: {
          value: {
            username: 'admin',
            password: 'wrongpassword',
          },
        },
      };

      await formSubmit(event);

      expect(mockWx.hideLoading).toHaveBeenCalled();
      expect(mockWx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('登录失败'),
          icon: 'none',
        })
      );
    });
  });

  // ============================================
  // NEW TESTS: 微信登录功能
  // ============================================
  describe('WeChat Login', () => {
    it('should call wx.login and then wechatLogin API on successful wechat login', async () => {
      mockWx.login.mockImplementation((options: any) => {
        options.success({ code: 'wechat-code-123' });
      });

      const mockUser = {
        id: 1,
        username: 'wechat_user',
        email: 'wechat@example.com',
        name: 'WeChat User',
        permissions: ['*'],
      };

      mockWechatLogin.mockResolvedValue({
        token: 'wechat-token-123',
        user: mockUser,
      });

      await handleWechatLogin();

      expect(mockWx.login).toHaveBeenCalled();
      expect(mockWechatLogin).toHaveBeenCalledWith('wechat-code-123');
      expect(mockWx.setStorageSync).toHaveBeenCalledWith('auth_token', 'wechat-token-123');
      expect(mockWx.setStorageSync).toHaveBeenCalledWith('user_info', mockUser);
    });

    it('should show error when wx.login fails', async () => {
      mockWx.login.mockImplementation((options: any) => {
        options.fail({ errMsg: 'login failed' });
      });

      await handleWechatLogin();

      expect(mockWx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('微信登录失败'),
          icon: 'none',
        })
      );
      expect(mockWechatLogin).not.toHaveBeenCalled();
    });

    it('should show error when wechatLogin API returns error', async () => {
      mockWx.login.mockImplementation((options: any) => {
        options.success({ code: 'wechat-code-123' });
      });

      mockWechatLogin.mockRejectedValue(new Error('WeChat auth failed'));

      await handleWechatLogin();

      expect(mockWx.hideLoading).toHaveBeenCalled();
      expect(mockWx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('微信登录失败'),
          icon: 'none',
        })
      );
    });

    it('should show loading during wechat login', async () => {
      mockWx.login.mockImplementation((options: any) => {
        options.success({ code: 'wechat-code-123' });
      });

      mockWechatLogin.mockResolvedValue({
        token: 'wechat-token-123',
        user: { id: 1, username: 'test' },
      });

      await handleWechatLogin();

      expect(mockWx.showLoading).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '微信登录中...',
          mask: true,
        })
      );
    });
  });

  // ============================================
  // NEW TESTS: 记住密码功能
  // ============================================
  describe('Remember Password', () => {
    it('should save credentials when remember password is checked', async () => {
      const credentials = {
        username: 'admin',
        password: 'password123',
      };

      await handleRememberPassword(credentials, true);

      expect(mockSaveRememberedCredentials).toHaveBeenCalledWith(credentials);
    });

    it('should clear credentials when remember password is unchecked', async () => {
      await handleRememberPassword({ username: 'admin', password: 'password123' }, false);

      expect(mockClearRememberedCredentials).toHaveBeenCalled();
    });

    it('should load saved credentials on page load if auto login fails', async () => {
      const savedCredentials = {
        username: 'saved_user',
        password: 'saved_pass',
      };

      mockLoadRememberedCredentials.mockReturnValue(savedCredentials);
      mockHasRememberedCredentials.mockReturnValue(true);
      mockAutoLogin.mockRejectedValue(new Error('Auto login failed'));

      jest.resetModules();
      require('./login');

      const pageConfig = getPageConfig();
      const mockThis = {
        setData: jest.fn(),
      };

      await pageConfig.onLoad.call(mockThis);

      await jest.runAllTimersAsync();

      expect(mockThis.setData).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'saved_user',
          password: 'saved_pass',
          rememberPassword: true,
        })
      );
    });

    it('should save credentials after successful login if remember is checked', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        name: 'Admin',
        permissions: ['*'],
      };

      mockLogin.mockResolvedValue({
        token: 'test-token-123',
        user: mockUser,
      });

      const event = {
        detail: {
          value: {
            username: 'admin',
            password: 'password123',
            rememberPassword: true,
          },
        },
      };

      await formSubmit(event);

      expect(mockSaveRememberedCredentials).toHaveBeenCalledWith({
        username: 'admin',
        password: 'password123',
      });
    });

    it('should clear saved credentials if remember is unchecked during login', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        name: 'Admin',
        permissions: ['*'],
      };

      mockLogin.mockResolvedValue({
        token: 'test-token-123',
        user: mockUser,
      });

      const event = {
        detail: {
          value: {
            username: 'admin',
            password: 'password123',
            rememberPassword: false,
          },
        },
      };

      await formSubmit(event);

      expect(mockClearRememberedCredentials).toHaveBeenCalled();
    });
  });

  // ============================================
  // NEW TESTS: 自动登录功能
  // ============================================
  describe('Auto Login', () => {
    it('should attempt auto login if saved credentials exist', async () => {
      mockHasRememberedCredentials.mockReturnValue(true);
      mockAutoLogin.mockResolvedValue({
        token: 'auto-token-123',
        user: { id: 1, username: 'admin' },
      });

      jest.resetModules();
      require('./login');

      const pageConfig = getPageConfig();
      const mockThis = {
        setData: jest.fn(),
      };

      await pageConfig.onLoad.call(mockThis);

      expect(mockHasRememberedCredentials).toHaveBeenCalled();
      expect(mockAutoLogin).toHaveBeenCalled();
    });

    it('should redirect to index after successful auto login', async () => {
      mockHasRememberedCredentials.mockReturnValue(true);
      mockAutoLogin.mockResolvedValue({
        token: 'auto-token-123',
        user: { id: 1, username: 'admin' },
      });

      jest.resetModules();
      require('./login');

      const pageConfig = getPageConfig();
      const mockThis = {
        setData: jest.fn(),
      };

      await pageConfig.onLoad.call(mockThis);

      await jest.runAllTimersAsync();

      expect(mockWx.switchTab).toHaveBeenCalledWith({
        url: '/pages/index/index',
      });
    });

    it('should show login form if auto login fails', async () => {
      mockHasRememberedCredentials.mockReturnValue(true);
      mockAutoLogin.mockRejectedValue(new Error('Auto login failed'));
      mockLoadRememberedCredentials.mockReturnValue({
        username: 'saved_user',
        password: 'saved_pass',
      });

      jest.resetModules();
      require('./login');

      const pageConfig = getPageConfig();
      const mockThis = {
        setData: jest.fn(),
      };

      await pageConfig.onLoad.call(mockThis);

      await jest.runAllTimersAsync();

      expect(mockWx.switchTab).not.toHaveBeenCalled();
    });

    it('should not attempt auto login if no saved credentials', async () => {
      mockHasRememberedCredentials.mockReturnValue(false);

      jest.resetModules();
      require('./login');

      const pageConfig = getPageConfig();
      const mockThis = {
        setData: jest.fn(),
      };

      await pageConfig.onLoad.call(mockThis);

      expect(mockAutoLogin).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // NEW TESTS: 记住密码开关处理
  // ============================================
  describe('Remember Password Toggle', () => {
    it('should update rememberPassword state when toggled', () => {
      jest.resetModules();
      require('./login');

      const pageConfig = getPageConfig();
      const mockThis = {
        setData: jest.fn(),
        data: {
          rememberPassword: false,
        },
      };

      pageConfig.onRememberToggle.call(mockThis, {
        detail: { value: true },
      });

      expect(mockThis.setData).toHaveBeenCalledWith({ rememberPassword: true });
    });
  });
});