// app.js

App({
  globalData: {},
  onLaunch() {
    const that = this;
    wx.getSystemInfo({
      success(res) {
        var cap = wx.getMenuButtonBoundingClientRect();
        if (cap) {
          that.globalData.capsuleHeight = cap.bottom;
        } else {
          that.globalData.capsuleHeight = res.statusBarHeight + 50
        }
      }
    });
  }
});