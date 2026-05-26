// 小程序入口文件

App({
  onLaunch() {
    console.log('App launched');
    this.initializeApp();
  },

  /**
   * 应用初始化
   */
  initializeApp() {
    // 检查登录状态
    this.checkLogin();
  },

  /**
   * 检查登录状态
   */
  checkLogin() {
    const token = wx.getStorageSync('token');
    const refreshToken = wx.getStorageSync('refreshToken');

    if (token && refreshToken) {
      this.globalData.isLoggedIn = true;
    } else {
      this.globalData.isLoggedIn = false;
    }
  },

  /**
   * 微信登录
   */
  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            // 获取用户信息
            wx.getUserProfile({
              desc: '获取您的昵称、头像信息',
              success: (userRes) => {
                // 调用后端登录接口
                this.apiCall('/auth/login', 'POST', {
                  code: res.code,
                  userInfo: userRes.userInfo
                }).then(result => {
                  // 保存令牌
                  wx.setStorageSync('token', result.data.token);
                  wx.setStorageSync('refreshToken', result.data.refreshToken);
                  wx.setStorageSync('user', result.data.user);

                  this.globalData.isLoggedIn = true;
                  this.globalData.user = result.data.user;

                  resolve(result);
                }).catch(reject);
              },
              fail: reject
            });
          } else {
            reject(new Error('获取登录码失败'));
          }
        },
        fail: reject
      });
    });
  },

  /**
   * API 调用方法
   */
  apiCall(url, method = 'GET', data = {}) {
    const baseURL = this.globalData.apiBaseURL;
    const token = wx.getStorageSync('token');

    return new Promise((resolve, reject) => {
      const header = {
        'Content-Type': 'application/json'
      };

      if (token) {
        header['Authorization'] = `Bearer ${token}`;
      }

      wx.request({
        url: `${baseURL}${url}`,
        method,
        data,
        header,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            // Token 过期，尝试刷新
            this.refreshToken().then(() => {
              // 重新发送请求
              this.apiCall(url, method, data).then(resolve).catch(reject);
            }).catch(reject);
          } else {
            reject(res.data);
          }
        },
        fail: reject
      });
    });
  },

  /**
   * 刷新令牌
   */
  refreshToken() {
    const refreshToken = wx.getStorageSync('refreshToken');

    if (!refreshToken) {
      return Promise.reject(new Error('没有刷新令牌'));
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.apiBaseURL}/auth/refresh`,
        method: 'POST',
        data: { refreshToken },
        header: { 'Content-Type': 'application/json' },
        success: (res) => {
          if (res.statusCode === 200) {
            wx.setStorageSync('token', res.data.data.token);
            resolve();
          } else {
            reject(new Error('刷新令牌失败'));
          }
        },
        fail: reject
      });
    });
  },

  /**
   * 全局数据
   */
  globalData: {
    apiBaseURL: 'https://api.yourdomain.com/v1', // 改为实际的 API 地址
    isLoggedIn: false,
    user: null
  }
});
