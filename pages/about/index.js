// pages/about/index.js

import {
  localData
} from "./localData.js";

const app = getApp();

var debugInfo = {
  environment: {
    platform: app.globalData.systemInfo.platform,
    version: app.globalData.systemInfo.version,
    SDKVersion: app.globalData.systemInfo.SDKVersion,
    skyline: {
      isSupported: app.globalData.skylineInfo.isSupported,
      version: app.globalData.skylineInfo.isSupported ? app.globalData.skylineInfo.version : "-1"
    }
  },
  device: {
    barnd: app.globalData.systemInfo.barnd,
    model: app.globalData.systemInfo.model,
    system: app.globalData.systemInfo.system
  },
  layout: {
    screen: {
      width: app.globalData.systemInfo.screenWidth,
      height: app.globalData.systemInfo.screenHeight
    },
    window: {
      width: app.globalData.systemInfo.windowWidth,
      height: app.globalData.systemInfo.windowHeight
    },
    statusBarHeight: app.globalData.systemInfo.statusBarHeight,
    pixelRatio: app.globalData.systemInfo.pixelRatio,
    deviceOrientation: app.globalData.systemInfo.deviceOrientation
  }
}

Page({
  data: {
    libCurr: {
      name: "SierraQin/列车运行前方",
      repoUrl: "https://github.com/SierraQin/Hyacinth",
      license: localData.projLicenseText
    },
    libList: [{
      name: "SierraQin/北京市轨道交通线路配置图",
      usedBy: [
        "pages/proj853/index",
        "pages/proj853/legacy/index",
      ],
      license: localData.licenseText.proj853
    }, {
      name: "Tencent/tdesign-miniprogram",
      usedBy: [
        "pages/about/index",
        "pages/farecalc/index",
        "pages/index/index",
        //"pages/orgchart/index",
      ],
      license: localData.licenseText["tdesign-miniprogram"]
    }, {
      name: "npm/node-semver",
      usedBy: [
        "pages/index/index",
      ],
      license: localData.licenseText.semver
    }, {
      name: "dankogai/js-base64",
      usedBy: [
        "pages/proj853/legacy/index",
      ],
      license: localData.licenseText["js-base64"]
    }],

    debugInfoCurr: ["debugCheckbox-0", "debugCheckbox-1", "debugCheckbox-2"],
    debugInfoText: "",
    debugInfoCheckbox: [{
        label: "运行环境",
        value: "debugCheckbox-0",
        content: "包含如下信息: 系统平台、微信版本、基础库版本、是否支持Skyline、Skyline版本"
      },
      {
        label: "设备性能",
        value: "debugCheckbox-1",
        content: "包含如下信息: 设备品牌、设备型号、操作系统及版本、性能等级"
      },
      {
        label: "页面布局",
        value: "debugCheckbox-2",
        content: "包含如下信息: 屏幕宽度、屏幕高度、窗口宽度、窗口高度、设备方向、设备像素比"
      }
    ],

  },

  onLoad() {
    this.setDebugInfoText();
  },

  setDebugInfoText() {
    let r = {};
    this.data.debugInfoCurr.forEach((value, index, array) => {
      let attrList = ["environment", "device", "layout"];
      let a = attrList[value.slice(14)];
      r[a] = debugInfo[a];
    });
    this.setData({
      debugInfoText: JSON.stringify(r)
    });
  },

  onShareAppMessage() {
    let title = "欢迎使用 列车运行前方";
    let path = "/pages/index/index";
    let imageUrl = "";
    return {
      title,
      path
    };
  },

  debugInfoCheckboxHandler(evt) {
    this.setData({
      debugInfoCurr: evt.detail.value,
    });
    this.setDebugInfoText();
  },

  navBackHandler() {
    wx.navigateBack({
      fail: () => {
        wx.navigateTo({
          url: "/pages/index/index",
        });
      }
    });
  }
});