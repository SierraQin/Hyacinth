// pages/proj853/index.js

const {
  shared,
  spring
} = wx.worklet;

import {
  GestureState
} from "./workletUi.js";

import {
  localData
} from "./localData.js";

const app = getApp();

var defaultCoord = {
  x: 318,
  y: 738,
  scale: 20
};


Page({
  data: {
    // Const
    svgProd: "https://static.qinxr.cn/proj853/prod.svg",
    svgDev: "https://mtr.qinxr.cn/src/MTR2.svg",
    tabBtnIconList: localData.iconB64,
    tabBtnTxtList: ["重置缩放", "版本切换", "文件下载", "项目说明"],
    msgBoxTitleList: ["const that = this;", "配线图版本切换", "PDF文件下载", "配线图说明","临时通知标题"],

    // Init Value
    devInfo: {
      author: "加载中",
      date: "加载中",
      msg: "加载中",
      sha: "加载中",
      shaShort: "加载中"
    },
    prodInfo: {
      ver: "加载中",
      date: "加载中"
    },

    // Settings
    menuCurr: 4,
    isDev: false,

    // Layout
    infoPos: app.globalData.capsuleHeight,
    msgBoxPos: app.globalData.systemInfo.windowHeight * 0.3,
    msgBoxHeight: 0,
  },



  onLoad() {
    const that = this;

    // 仿写自微信小程序官方Demo
    // https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/gesture.html
    const scale = shared(defaultCoord.scale);
    const x = shared(defaultCoord.x);
    const y = shared(defaultCoord.y);
    this.applyAnimatedStyle('.svg_xy', () => {
      "worklet";
      return {
        transform: `translate(${x.value}rpx, ${y.value}rpx)`,
      };
    });
    this.applyAnimatedStyle('.svg_scale', () => {
      "worklet";
      return {
        transform: `scale(${ scale.value })`,
      };
    });
    this.scale = scale;
    this.lastScale = shared(defaultCoord.scale);
    this.x = x;
    this.y = y;

    wx.request({
      url: "https://static.qinxr.cn/proj853/config.json",
      method: "GET",
      success(res) {
        that.setData({
          devInfo: res.data.dev,
          prodInfo: res.data.prod
        });
      }
    });

    let h = 100;
    const sq = wx.createSelectorQuery();
    sq.select("#tabBarMain").boundingClientRect();
    sq.selectViewport().scrollOffset();
    sq.exec(function (res) {
      h = res[0].top - app.globalData.systemInfo.windowHeight * 0.3 - 20 / 750 * app.globalData.systemInfo.screenWidth;
      that.setData({
        msgBoxHeight: h
      });
    });

  },

  tabBtnHandler(evt) {
    var idx = parseInt(evt.currentTarget.id.slice(7));

    if (idx == 0) {
      this.reset();
      this.setData({
        menuCurr: 0
      });
    } else if (idx == this.data.menuCurr) {
      this.setData({
        menuCurr: 0
      });
      return;
    } else if (idx < 4) {
      this.setData({
        menuCurr: idx
      });
    }
  },

  hideMenu() {
    this.setData({
      menuCurr: 0
    });
  },

  switchSource() {
    this.setData({
      isDev: !this.data.isDev
    });
  },

  handleGesture(evt) {
    "worklet";

    if (evt.pointerCount == 2) {
      this.handleScale(evt);
    } else {
      this.handleDrag(evt);
    }

    if (evt.state === GestureState.END || evt.state === GestureState.CANCELLED) {
      this.lastScale.value = this.scale.value;
    }

    // console.log("x: " + this.x.value + ", y: " + this.y.value + ", z: " + this.scale.value);
  },

  handleScale(evt) {
    "worklet";
    this.scale.value = evt.scale * this.lastScale.value;
  },

  handleDrag(evt) {
    "worklet";
    if (evt.state === GestureState.ACTIVE) {
      this.x.value += evt.focalDeltaX * 2;
      this.y.value += evt.focalDeltaY * 2;
    }
  },

  reset() {
    "worklet";
    this.scale.value = defaultCoord.scale;
    this.lastScale.value = defaultCoord.scale;
    this.x.value = defaultCoord.x;
    this.y.value = defaultCoord.y;
  },



});