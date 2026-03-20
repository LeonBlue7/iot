// miniprogram/pages/control/control.ts
Page({
  data: {
    deviceId: '',
    controlType: null as string | null,
    loading: false,
  },

  onLoad(options: { id?: string; type?: string }) {
    const deviceId = options.id || '';
    const controlType = options.type || null;
    this.setData({ deviceId, controlType });
  },

  async onPowerToggle() {
    const { deviceId } = this.data;

    wx.showLoading({ title: '发送中...' });

    try {
      const { controlDevice } = await import('../../utils/api');
      await controlDevice(deviceId, 'on');

      wx.showToast({
        title: '控制成功',
        icon: 'success',
      });
    } catch (error) {
      wx.showToast({
        title: '控制失败',
        icon: 'none',
      });
    } finally {
      wx.hideLoading();
    }
  },

  async onReset() {
    const { deviceId } = this.data;

    wx.showLoading({ title: '发送中...' });

    try {
      const { controlDevice } = await import('../../utils/api');
      await controlDevice(deviceId, 'reset');

      wx.showToast({
        title: '控制成功',
        icon: 'success',
      });
    } catch (error) {
      wx.showToast({
        title: '控制失败',
        icon: 'none',
      });
    } finally {
      wx.hideLoading();
    }
  },

  onBack() {
    wx.navigateBack();
  },
});
