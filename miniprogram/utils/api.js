// utils/api.js - API service

const app = getApp();

/**
 * Device APIs
 */
const deviceApi = {
  // Get all devices
  getDevices() {
    return app.request({ url: '/devices' });
  },

  // Get device by ID
  getDevice(id) {
    return app.request({ url: `/devices/${id}` });
  },

  // Get realtime data
  getRealtimeData(id) {
    return app.request({ url: `/devices/${id}/realtime` });
  },

  // Get history data
  getHistoryData(id, startTime, endTime, limit = 100) {
    return app.request({
      url: `/devices/${id}/history`,
      data: { startTime, endTime, limit }
    });
  },

  // Update device
  updateDevice(id, data) {
    return app.request({
      url: `/devices/${id}`,
      method: 'PUT',
      data
    });
  },

  // Control device
  controlDevice(id, action) {
    return app.request({
      url: `/devices/${id}/control`,
      method: 'POST',
      data: { action }
    });
  },

  // Get device params
  getParams(id) {
    return app.request({ url: `/devices/${id}/params` });
  },

  // Update device params
  updateParams(id, params) {
    return app.request({
      url: `/devices/${id}/params`,
      method: 'PUT',
      data: params
    });
  }
};

/**
 * Alarm APIs
 */
const alarmApi = {
  // Get alarms
  getAlarms(params = {}) {
    return app.request({
      url: '/alarms',
      data: params
    });
  },

  // Acknowledge alarm
  acknowledgeAlarm(id) {
    return app.request({
      url: `/alarms/${id}/acknowledge`,
      method: 'PUT'
    });
  },

  // Resolve alarm
  resolveAlarm(id) {
    return app.request({
      url: `/alarms/${id}/resolve`,
      method: 'PUT'
    });
  }
};

/**
 * Stats APIs
 */
const statsApi = {
  // Get overview stats
  getOverview() {
    return app.request({ url: '/stats/overview' });
  },

  // Get trend data
  getTrend(deviceId, metric, startTime, endTime) {
    return app.request({
      url: '/stats/trend',
      data: { deviceId, metric, startTime, endTime }
    });
  },

  // Get daily stats
  getDaily(deviceId, date) {
    return app.request({
      url: '/stats/daily',
      data: { deviceId, date }
    });
  }
};

module.exports = {
  deviceApi,
  alarmApi,
  statsApi
};