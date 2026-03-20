// miniprogram/pages/device/device.ts
import { Device, SensorData, getDeviceById, getRealtimeData } from '../../utils/api';

interface PageData {
  device: Device | null;
  realtimeData: SensorData | null;
  loading: boolean;
  temperature: number | null;
  humidity: number | null;
  statusText: string;
}

Page({
  data: {
    deviceId: '',
    device: null,
    realtimeData: null,
    loading: true,
    temperature: null,
    humidity: null,
    statusText: '加载中...',
  } as PageData,

  onLoad(options: { id?: string }) {
    const id = options.id || '';
    this.setData({ deviceId: id });
    this.loadDeviceData(id);
  },

  async loadDeviceData(deviceId: string) {
    this.setData({ loading: true });

    try {
      const [device, realtimeData] = await Promise.all([
        getDeviceById(deviceId),
        getRealtimeData(deviceId),
      ]);

      this.setData({
        device,
        realtimeData,
        temperature: realtimeData?.temperature ?? null,
        humidity: realtimeData?.humidity ?? null,
        statusText: device.online ? '设备在线' : '设备离线',
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

  onRefresh() {
    this.loadDeviceData(this.data.deviceId);
  },

  onControlTap() {
    wx.navigateTo({
      url: `/pages/control/control?id=${this.data.deviceId}`,
    });
  },

  onParamsTap() {
    wx.navigateTo({
      url: `/pages/params/params?id=${this.data.deviceId}`,
    });
  },

  onPullDownRefresh() {
    this.onRefresh();
    wx.stopPullDownRefresh();
  },
});
