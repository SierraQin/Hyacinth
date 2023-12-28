// pages/index/index.js

import {
  localData
} from "./localData.js";

const semver = require("semver");

const app = getApp();

Page({
  data: {
    //cardList: [true, false, false, false, false],
    cardList: [true, true, true, true, true, true, true, true],
    cardBgList: localData.cardBgB64,
    cardTitleList: ["路网配线图", "路网配线图(旧)", "占位", "占位", "占位", "占位", "占位", "占位"],
    cardTextList: [
      "基于Skyline渲染引擎彻底进行重构，显著降低掉帧卡顿",
      "旧版小程序，专为Mac及较老版本微信保留（占位）",
      "（占位）",
      "（占位）",
      "（占位）",
      "（占位）",
      "（占位）",
      "（占位）"
    ],
    cardIconList: [
      "map-collection",
      "map-cancel",
      "indicator",
      "bug",
      "info-circle",
      "chart-line",
      "subway-line",
      "tools"
    ],
    cardUrlList: [
      "/pages/proj853/index",
      "",
      "",
      "",
      "",
      "",
      "",
      ""
    ],

    dialogId: -1,

    compatibility853: {
      isSupported: false,
      msg: "",
    },
    dialog853Btn: {
      content: "好的"
    }
  },

  onLoad() {
    let c853 = this.check853Compatibility();
    this.setData({
      compatibility853: {
        isSupported: c853 == "" ? true : false,
        msg: c853
      }
    });

    console.log(this.data)
  },

  check853Compatibility() {
    let c = {
      platform: {
        curr: app.globalData.systemInfo.platform
      },
      wechat: {
        required: "8.0.44",
        curr: app.globalData.systemInfo.version
      },
      sdk: {
        required: "3.2.2",
        curr: app.globalData.systemInfo.SDKVersion
      },
      skyline: {
        required: "1.1.4",
        supported: app.globalData.skylineInfo.isSupported,
        curr: app.globalData.skylineInfo.version
      },
    };
    let r = ""
    if (c.platform.curr == "devtools") {
      //return "";
    } else if (c.platform.curr != "ios" && c.platform.curr != "android") {
      return `操作系统: ${c.platform.curr} , 要求 android或ios`;
    }

    if (semver.lt(c.wechat.curr, c.wechat.required)) {
      r += `微信客户端: 当前 ${c.wechat.curr} , 要求 >=${c.wechat.required}\n`;
    }

    if (semver.lt(c.sdk.curr, c.sdk.required)) {
      r += `小程序基础库: 当前 ${c.wechat.curr} , 要求 >=${c.wechat.required}\n`;
    }

    if (!c.skyline.supported) {
      r += "Skyline渲染引擎: 不支持";
    } else if (semver.lt(c.skyline.curr, c.skyline.required)) {
      r += `Skyline渲染引擎: 当前 ${c.wechat.curr} , 要求 >=${c.wechat.required}\n`;
    }

    return r;
  },

  dialogCloseHandler() {
    this.setData({
      dialogId: -1
    });
  },

  cardNaviHandler(evt) {
    const that = this;
    var idx = parseInt(evt.currentTarget.id.slice(5));

    switch (idx) {
      case 0: {
        if (that.data.compatibility853.isSupported) {
          wx.navigateTo({
            url: that.data.cardUrlList[idx]
          });
        } else {
          let m = that.data.compatibility853.msg;
          this.setData({
            dialogId: 0,
            compatibility853: {
              isSupported: true,
              msg: m
            }
          });
          console.log(that.data)
        }
      }
    }
  }

});