// pages/index/index.js

import {
  localData
} from "./localData.js";

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