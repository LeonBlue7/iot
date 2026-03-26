// miniprogram/pages/login/login.ts
import {
  login,
  LoginParams,
  wechatLogin,
  saveRememberedCredentials,
  loadRememberedCredentials,
  clearRememberedCredentials,
  hasRememberedCredentials,
  autoLogin,
  RememberedCredentials,
} from '../../utils/auth';

interface LoginPageData {
  username: string;
  password: string;
  rememberPassword: boolean;
  isLoading: boolean;
}

interface FormSubmitEvent {
  detail: {
    value: {
      username?: string;
      password?: string;
      rememberPassword?: boolean;
    };
  };
}

/**
 * 表单提交处理函数（可测试导出）
 */
export async function formSubmit(e: FormSubmitEvent): Promise<void> {
  const params: LoginParams = {
    username: e.detail.value.username?.trim(),
    password: e.detail.value.password?.trim(),
  };
  const rememberPassword = e.detail.value.rememberPassword ?? false;

  // 验证输入
  if (!params.username) {
    wx.showToast({
      title: '请输入用户名',
      icon: 'none',
    });
    return;
  }

  if (!params.password) {
    wx.showToast({
      title: '请输入密码',
      icon: 'none',
    });
    return;
  }

  try {
    wx.showLoading({
      title: '登录中...',
      mask: true,
    });

    const result = await login(params);

    wx.hideLoading();

    // 存储 token 和用户信息
    wx.setStorageSync('auth_token', result.token);
    wx.setStorageSync('user_info', result.user);

    // 处理记住密码
    if (rememberPassword) {
      saveRememberedCredentials({
        username: params.username,
        password: params.password,
      });
    } else {
      clearRememberedCredentials();
    }

    wx.showToast({
      title: '登录成功',
      icon: 'success',
    });

    // 跳转到主页
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/index/index',
      });
    }, 1000);
  } catch (error) {
    wx.hideLoading();

    wx.showToast({
      title: error instanceof Error ? `登录失败：${error.message}` : '登录失败，请检查网络',
      icon: 'none',
    });
  }
}

/**
 * 微信登录处理函数（可测试导出）
 */
export async function handleWechatLogin(): Promise<void> {
  try {
    wx.showLoading({
      title: '微信登录中...',
      mask: true,
    });

    // 获取微信登录 code
    const loginResult = await new Promise<string>((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            resolve(res.code);
          } else {
            reject(new Error('获取登录凭证失败'));
          }
        },
        fail: (err) => {
          reject(new Error(err.errMsg || '微信登录失败'));
        },
      });
    });

    // 发送到后端验证
    const result = await wechatLogin(loginResult);

    wx.hideLoading();

    // 存储 token 和用户信息
    wx.setStorageSync('auth_token', result.token);
    wx.setStorageSync('user_info', result.user);

    wx.showToast({
      title: '登录成功',
      icon: 'success',
    });

    // 跳转到主页
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/index/index',
      });
    }, 1000);
  } catch (error) {
    wx.hideLoading();

    wx.showToast({
      title: error instanceof Error ? `微信登录失败：${error.message}` : '微信登录失败，请重试',
      icon: 'none',
    });
  }
}

/**
 * 记住密码处理函数（可测试导出）
 */
export async function handleRememberPassword(
  credentials: RememberedCredentials,
  remember: boolean
): Promise<void> {
  if (remember) {
    saveRememberedCredentials(credentials);
  } else {
    clearRememberedCredentials();
  }
}

/**
 * 加载保存的凭证（可测试导出）
 */
export function loadSavedCredentials(): RememberedCredentials | null {
  if (hasRememberedCredentials()) {
    return loadRememberedCredentials();
  }
  return null;
}

Page({
  data: {
    username: '',
    password: '',
    rememberPassword: false,
    isLoading: false,
  } as LoginPageData,

  async onLoad() {
    // 检查是否已登录，如果已登录则跳转回上一页
    const userInfo = wx.getStorageSync('user_info');
    if (userInfo) {
      wx.navigateBack();
      return;
    }

    // 检查是否有保存的凭证，尝试自动登录
    if (hasRememberedCredentials()) {
      try {
        this.setData({ isLoading: true });
        wx.showLoading({
          title: '自动登录中...',
          mask: true,
        });

        const result = await autoLogin();

        wx.hideLoading();
        this.setData({ isLoading: false });

        // 存储 token 和用户信息
        wx.setStorageSync('auth_token', result.token);
        wx.setStorageSync('user_info', result.user);

        wx.showToast({
          title: '登录成功',
          icon: 'success',
        });

        // 跳转到主页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index',
          });
        }, 1000);
      } catch {
        wx.hideLoading();
        this.setData({ isLoading: false });

        // 自动登录失败，加载保存的凭证到表单
        const savedCredentials = loadSavedCredentials();
        if (savedCredentials) {
          this.setData({
            username: savedCredentials.username,
            password: savedCredentials.password,
            rememberPassword: true,
          });
        }
      }
    }
  },

  // 输入框变化处理
  onUsernameInput(e: WechatMiniprogram.Input) {
    this.setData({
      username: e.detail.value,
    });
  },

  onPasswordInput(e: WechatMiniprogram.Input) {
    this.setData({
      password: e.detail.value,
    });
  },

  // 记住密码开关处理
  onRememberToggle(e: WechatMiniprogram.SwitchChange) {
    this.setData({
      rememberPassword: e.detail.value,
    });
  },

  // 表单提交处理
  async formSubmit(e: FormSubmitEvent) {
    await formSubmit(e);
  },

  // 微信登录处理
  async onWechatLogin() {
    await handleWechatLogin();
  },
});