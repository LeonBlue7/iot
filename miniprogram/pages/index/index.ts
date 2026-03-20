// miniprogram/pages/index/index.ts
Page({
  data: {
    deviceList: [] as Array<{
      id: string;
      name: string;
      online: boolean;
    }>,
    loading: false,
  },

  onLoad() {
    this.loadDevices();
  },

  async loadDevices() {
    const app = getApp() as any;

    this.setData({ loading: true });

    try {
      const result = await app.request({
        url: '/devices',
        method: 'GET',
      });

      this.setData({
        deviceList: result || [],
        loading: false,
      });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none',
      });
    }
  },

  onDeviceTap(e: any) {
    const deviceId = e.currentTarget.dataset.deviceId;
    wx.navigateTo({
      url: `/pages/device/device?id=${deviceId}`,
    });
  },

  async onPullDownRefresh() {
    await this.loadDevices();
    wx.stopPullDownRefresh();
  },

  onShow() {
    // Reload devices when returning to this page
    this.loadDevices();
  },
});
