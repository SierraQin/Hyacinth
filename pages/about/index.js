// pages/about/index.js

import {
  localData
} from "./localData.js";

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
        "pages/index/index",
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
  },

  onLoad() {},

  onShareAppMessage() {
    let title = "欢迎使用 列车运行前方";
    let path = "/pages/index/index";
    let imageUrl = "";
    return {
      title,
      path
    };
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