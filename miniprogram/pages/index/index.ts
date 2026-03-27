// miniprogram/pages/index/index.ts

interface DeviceItem {
  id: string;
  name: string;
  online: boolean;
}

interface PageOptions {
  groupId?: string;
  groupName?: string;
}

interface DeviceTapEvent {
  currentTarget: {
    dataset: {
      deviceId: string;
    };
  };
}

Page({
  data: {
    deviceList: [] as DeviceItem[],
    loading: false,
  },

  onLoad(options: PageOptions) {
    // 支持从分组页面跳转时显示特定分组的设备
    if (options.groupId) {
      const groupName = decodeURIComponent(options.groupName || '分组设备');
      wx.setNavigationBarTitle({ title: groupName });
    }
    this.loadDevices();
  },

  async loadDevices() {
    const app = getApp<IAppOption>();

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
    } catch {
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none',
      });
    }
  },

  onDeviceTap(e: DeviceTapEvent) {
    const deviceId = e.currentTarget.dataset.deviceId;
    if (!deviceId) {
      wx.showToast({ title: '设备ID无效', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/device/device?id=${deviceId}`,
    });
  },

  onGroupsTap() {
    wx.navigateTo({
      url: '/pages/groups/groups',
    });
  },

  onAddDevice() {
    wx.scanCode({
      success: (res) => {
        const deviceId = res.result;
        wx.navigateTo({
          url: `/pages/device/device?id=${deviceId}&mode=add`,
        });
      },
      fail: () => {
        wx.showToast({
          title: '扫码取消',
          icon: 'none',
        });
      },
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
