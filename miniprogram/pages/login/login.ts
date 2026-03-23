// miniprogram/pages/login/login.ts
import { login, LoginParams } from '../../utils/auth';

interface LoginPageData {
  username: string;
  password: string;
}

interface FormSubmitEvent {
  detail: {
    value: {
      username?: string;
      password?: string;
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

Page({
  data: {
    username: '',
    password: '',
  } as LoginPageData,

  onLoad() {
    // 检查是否已登录，如果已登录则跳转回上一页
    const userInfo = wx.getStorageSync('user_info');
    if (userInfo) {
      wx.navigateBack();
    }
  },

  // 输入框变化处理
  onUsernameInput(e: any) {
    this.setData({
      username: e.detail.value,
    });
  },

  onPasswordInput(e: any) {
    this.setData({
      password: e.detail.value,
    });
  },

  // 表单提交处理
  async formSubmit(e: any) {
    await formSubmit(e);
  },
});
