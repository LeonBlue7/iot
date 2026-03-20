// miniprogram/pages/params/params.ts
import { getDeviceParams, updateDeviceParams, DeviceParams } from '../../utils/api';

Page({
  data: {
    deviceId: '',
    params: null as DeviceParams | null,
    loading: true,
  },

  onLoad(options: { id?: string }) {
    const deviceId = options.id || '';
    this.setData({ deviceId });
    this.loadParams(deviceId);
  },

  async loadParams(deviceId: string) {
    this.setData({ loading: true });

    try {
      const params = await getDeviceParams(deviceId);
      this.setData({
        params,
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

  async onSave() {
    const { deviceId } = this.data;
    const { params } = this.data;

    if (!params) {
      wx.showToast({
        title: '参数未加载',
        icon: 'none',
      });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    try {
      await updateDeviceParams(deviceId, params);
      wx.showToast({
        title: '保存成功',
        icon: 'success',
      });
    } catch (error) {
      wx.showToast({
        title: '保存失败',
        icon: 'none',
      });
    } finally {
      wx.hideLoading();
    }
  },

  onParamChange(e: any) {
    const { key, value } = e.detail;
    const { params } = this.data;

    if (params) {
      this.setData({
        params: {
          ...params,
          [key]: value,
        },
      });
    }
  },

  onBack() {
    wx.navigateBack();
  },
});
