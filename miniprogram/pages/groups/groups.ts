// miniprogram/pages/groups/groups.ts
import { getGroups, DeviceGroup } from '../../utils/api';

Page({
  data: {
    groups: [] as DeviceGroup[],
    loading: true,
  },

  onLoad() {
    this.loadGroups();
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadGroups();
  },

  onPullDownRefresh() {
    this.loadGroups().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadGroups() {
    this.setData({ loading: true });

    try {
      const groups = await getGroups();
      this.setData({ groups, loading: false });
    } catch {
      wx.showToast({
        title: '加载失败',
        icon: 'error',
      });
      this.setData({ loading: false });
    }
  },

  onGroupTap(e: any) {
    const groupId = e.currentTarget.dataset.id;
    const groupName = e.currentTarget.dataset.name;

    // 跳转到分组设备列表
    wx.navigateTo({
      url: `/pages/index/index?groupId=${groupId}&groupName=${encodeURIComponent(groupName)}`,
    });
  },
});