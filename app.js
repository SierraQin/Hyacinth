// app.js

App({
  globalData: {
    guiText: {
      footer: "Made by SierraQin with ♥. License: LGPL-2.1",
      loadingFailDialogTitle: "数据同步错误",
      loadingFailDialogContent: "未能从服务器上成功下载数据。可能是你的手机网络不稳定，当然也有可能单纯是服务器出问题了。",
    },
    urlDic: {}
  },

  onLaunch() {
    const that = this;
    wx.getSystemInfo({
      success: (res) => {
        that.globalData.systemInfo = res;
        that.globalData.rpx2px = res.screenWidth / 750;
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
    let mpInfo = wx.getAccountInfoSync().miniProgram;
    let mpEnvEnum = {
      release: "prod",
      trial: "test",
      develop: "dev"
    };
    that.globalData.env = mpEnvEnum[mpInfo.envVersion];
    that.globalData.ver = mpInfo.envVersion == "release" ? mpInfo.version : NaN;
    that.globalData.debugMode = wx.getAppBaseInfo().enableDebug;
  }
});