// utils/util.js - Utility functions

/**
 * Format date
 */
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return '';

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  const second = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second);
}

/**
 * Format relative time
 */
function formatRelativeTime(date) {
  const now = new Date();
  const d = new Date(date);
  const diff = now - d;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return formatDate(date, 'MM-DD HH:mm');
}

/**
 * Show toast
 */
function showToast(title, icon = 'none') {
  wx.showToast({
    title,
    icon,
    duration: 2000
  });
}

/**
 * Show loading
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  });
}

/**
 * Hide loading
 */
function hideLoading() {
  wx.hideLoading();
}

/**
 * Show confirm dialog
 */
function showConfirm(content, title = '提示') {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm);
      }
    });
  });
}

/**
 * Get alarm type text
 */
function getAlarmTypeText(type) {
  const types = {
    'TEMP_HIGH': '温度过高',
    'TEMP_LOW': '温度过低',
    'HUMI_HIGH': '湿度过高',
    'HUMI_LOW': '湿度过低'
  };
  return types[type] || type;
}

/**
 * Get alarm status text
 */
function getAlarmStatusText(status) {
  const statuses = {
    0: '未处理',
    1: '已确认',
    2: '已解决'
  };
  return statuses[status] || '未知';
}

module.exports = {
  formatDate,
  formatRelativeTime,
  showToast,
  showLoading,
  hideLoading,
  showConfirm,
  getAlarmTypeText,
  getAlarmStatusText
};