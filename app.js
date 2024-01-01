// app.js

App({
  globalData: {},

  onLaunch() {
    const that = this;
    wx.getSystemInfo({
      success(res) {
        that.globalData.systemInfo = res;
        var cap = wx.getMenuButtonBoundingClientRect();
        if (cap) {
          that.globalData.capsuleHeight = cap.bottom;
          that.globalData.capsuleTop = cap.top;
        } else {
          that.globalData.capsuleHeight = res.statusBarHeight + 50;
          that.globalData.capsuleTop = res.statusBarHeight + 10;
        }
      }
    });
    that.globalData.skylineInfo = wx.getSkylineInfoSync();
  }
});