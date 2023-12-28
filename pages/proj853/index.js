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

const urlList = {
  config: "https://static.qinxr.cn/proj853/config.json",
  svgProd: "https://static.qinxr.cn/proj853/prod.svg",
  svgDev: "https://mtr.qinxr.cn/src/MTR2.svg",
  staticFiles: "https://static.qinxr.cn/proj853/",
  artifacts: "https://mtr.qinxr.cn/build/"
};

var defaultCoord = {
  x: 318,
  y: 738,
  scale: 20
};

var allowDownload = true; // 默认false
var cfg = null;

Page({
  data: {
    // Const
    svgProd: urlList.svgProd,
    svgDev: urlList.svgDev,
    tabBtnIconList: localData.iconB64,
    tabBtnTxtList: ["重置缩放", "版本切换", "文件下载", "项目说明"],
    msgBoxTitleList: ["const that = this;", "配线图版本切换", "PDF文件下载", "配线图说明", "临时通知标题"],

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
    msgBox2btnTxt: "下载PDF",

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
      url: urlList.config,
      method: "GET",
      success(res) {
        cfg = res.data;
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

  downloadPdf() {
    const that = this;

    if (!allowDownload) {
      return;
    }

    wx.showLoading({
      title: "下载中...",
      mask: true,
    });

    allowDownload = false;
    that.setData({
      msgBox2btnTxt: "请稍候"
    });

    const fsm = wx.getFileSystemManager();
    var fileName = ""
    var pdfUrl = ""

    if (this.data.isDev) {
      let d = cfg.dev.date;
      fileName = "MTR" + d.slice(2, 4) + d.slice(5, 7) + d.slice(8, 10) + "_dev-" + cfg.dev.shaShort + ".pdf"
      pdfUrl = urlList.artifacts + fileName;
    } else {
      fileName = "MTR" + cfg.prod.ver + ".pdf"
      pdfUrl = urlList.staticFiles + fileName;
    }

    console.log(pdfUrl)

    wx.downloadFile({
      url: pdfUrl,
      success(res) {
        allowDownload = false;
        that.setData({
          msgBox2btnTxt: "已下载"
        });
        fsm.copyFileSync(res.tempFilePath, wx.env.USER_DATA_PATH + "/" + fileName);
        wx.shareFileMessage({
          filePath: wx.env.USER_DATA_PATH + "/" + fileName,
          fileName: fileName,
          fail: function () {
            allowDownload = true;
            that.setData({
              msgBox2btnTxt: "下载PDF"
            });
          },
          complete: function () {
            wx.hideLoading({});
          }
        });
      },
      fail: function () {
        allowDownload = true;
        that.setData({
          msgBox2btnTxt: "下载PDF"
        });
        wx.hideLoading({});
      }
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
    // 暂时屏蔽
    return;
    this.scale.value = defaultCoord.scale;
    this.lastScale.value = defaultCoord.scale;
    this.x.value = defaultCoord.x;
    this.y.value = defaultCoord.y;
  },



});