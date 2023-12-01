// pages/index/index.js

import {
  localData
} from "./localData.js";

Page({
  data: {
    //cardList: [true, false, false, false, false],
    cardList: [true, true, true, true, true],
    cardBgList: localData.cardBgB64,
    cardTitleList: ["路网配线图", "路网配线图(旧)", "站牌生成器", "反馈问题", "关于"],
    cardTextList: [
      "基于Skyline渲染引擎重构，缩放丝滑不卡顿",
      "旧版小程序，专为Mac及老版本微信保留",
      "无功能，占位",
      "无功能，占位",
      "无功能，占位"
    ],
    cardIconList: ["map-collection", "map-cancel", "indicator", "bug", "info-circle"],
    cardUrlList: [
      "/pages/proj853/index",
      "",
      "",
      "",
      ""
    ]
  },


  cardNaviHandler(evt) {
    const that = this;
    var idx = parseInt(evt.currentTarget.id.slice(5));
    wx.navigateTo({
      url: that.data.cardUrlList[idx]
    });
  }

});