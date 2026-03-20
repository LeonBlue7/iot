// app.js
App({
  globalData: {
    userInfo: null,
    baseUrl: 'https://www.jxbonner.cloud/api',
    // Development mode - set to false in production
    isDev: false,
    devBaseUrl: 'http://localhost:3000/api'
  },

  onLaunch() {
    // Check login status
    this.checkLoginStatus();
  },

  getBaseUrl() {
    return this.globalData.isDev ? this.globalData.devBaseUrl : this.globalData.baseUrl;
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.userInfo = wx.getStorageSync('userInfo');
    }
  },

  // Global request method
  request(options) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.getBaseUrl() + options.url,
        method: options.method || 'GET',
        data: options.data,
        header: {
          'Content-Type': 'application/json',
          'Authorization': wx.getStorageSync('token') || ''
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.success) {
            resolve(res.data.data);
          } else if (res.statusCode === 401) {
            // Token expired, redirect to login
            wx.removeStorageSync('token');
            wx.removeStorageSync('userInfo');
            this.globalData.userInfo = null;
            reject(new Error('Unauthorized'));
          } else {
            reject(new Error(res.data.error || 'Request failed'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }
});