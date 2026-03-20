// miniprogram/pages/alarms/alarms.ts
import { getAlarms, acknowledgeAlarm, AlarmRecord } from '../../utils/api';

Page({
  data: {
    alarms: [] as AlarmRecord[],
    loading: false,
    total: 0,
  },

  onLoad() {
    this.loadAlarms();
  },

  async loadAlarms() {
    this.setData({ loading: true });

    try {
      const result = await getAlarms();
      this.setData({
        alarms: result.data,
        total: result.total,
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

  async onAcknowledge(alarmId: number) {
    wx.showLoading({ title: '确认中...' });

    try {
      await acknowledgeAlarm(alarmId);

      // Update local state
      const { alarms } = this.data;
      const updatedAlarms = alarms.map((alarm) =>
        alarm.id === alarmId ? { ...alarm, status: 1 } : alarm
      );

      this.setData({ alarms: updatedAlarms });

      wx.showToast({
        title: '确认成功',
        icon: 'success',
      });
    } catch (error) {
      wx.showToast({
        title: '确认失败',
        icon: 'none',
      });
    } finally {
      wx.hideLoading();
    }
  },

  onPullDownRefresh() {
    this.loadAlarms().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onBack() {
    wx.navigateBack();
  },
});
