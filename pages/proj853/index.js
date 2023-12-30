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

var cfg = null;

Page({
  data: {
    // Const
    svgProd: urlList.svgProd,
    svgDev: urlList.svgDev,
    tabBtnIconList: localData.iconB64,
    ccbysaLogo: localData.ccbysaLogoB64,
    tabBtnTxtList: ["重置缩放", "版本切换", "文件下载", "项目说明"],
    msgBoxTitleList: ["const that = this;", "配线图版本切换", "PDF文件下载", "配线图说明", "临时通知标题"],
    msgBox3DescList: [
      "本图由互联网公开资料结合作者乘车经历整理推测而成，不保证图上内容的真实性和准确性.",
      "本图仅表示线路和车站之间的逻辑关系，并非按真实比例绘制，不应被作为规划出行的依据.",
      "本图标注的各类信息为作者根据互联网公开资料做出的推测，请以相关单位发布的信息为准.",
      "本图中标注的站间距均为估计值，仅供参考，可能与设计值或运营单位公布的数值存在差异.",
      "本图仅供学习研究使用，请合理合规使用本图，恕不承担用户违规使用本图造成的一切后果.",
    ],

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
    menuCurr: 0,
    isDev: false,
    allowDownload: false,
    msgBox2btnTxt: "加载中",

    // Layout
    infoPos: app.globalData.capsuleHeight,
    msgBoxPos: app.globalData.systemInfo.windowHeight * 0.3,
    msgBoxBottom: 120,
    msgBoxHeight: 100,
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

    var op = wx.getEnterOptionsSync().query;
    if (op.dev != undefined) {
      this.setData({
        isDev: true
      });
    }

    wx.request({
      url: urlList.config,
      method: "GET",
      success(res) {
        cfg = res.data;
        that.setData({
          devInfo: res.data.dev,
          prodInfo: res.data.prod,
          allowDownload: true,
          msgBox2btnTxt: "下载PDF"
        });
      }
    });

    let h = 100;
    let b = 120;
    const sq = wx.createSelectorQuery();
    sq.select("#tabBarMain").boundingClientRect();
    sq.selectViewport().scrollOffset();
    sq.exec(function (res) {
      b = app.globalData.systemInfo.windowHeight + 20 / 750 * app.globalData.systemInfo.screenWidth - res[0].top;
      h = res[0].top - app.globalData.systemInfo.windowHeight * 0.3 - 20 / 750 * app.globalData.systemInfo.screenWidth;
      that.setData({
        msgBoxBottom: b,
        msgBoxHeight: h
      });
    });

  },

  onShareAppMessage() {
    // 为了避免捕捉返回事件带来的复杂逻辑，后续计划所有分享页面均以传参的方式通过 /pages/index/index 页面进行跳转

    let title = `北京地铁路网配线图 ${this.isDev?"开发版":this.prodInfo.ver}`;
    let path = `/pages/proj853/index${this.isDev?"?dev":""}`;
    // 分享头图还没做好
    let imageUrl = "";
    return {
      title,
      //imageUrl
      path
    };
  },

  tabBtnHandler(evt) {
    var idx = parseInt(evt.currentTarget.id.slice(7));

    if (idx == 0) {
      this.resetZoom();
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
      isDev: !this.data.isDev,
      allowDownload: true
    });
  },

  switch2Prod() {
    this.setData({
      isDev: false,
      menuCurr: 0,
      allowDownload: true
    });
  },

  switch2Dev() {
    this.setData({
      isDev: true,
      menuCurr: 0,
      allowDownload: true
    });
  },

  downloadPdf() {
    const that = this;

    if (!that.data.allowDownload) {
      return;
    }

    wx.showLoading({
      title: "下载中...",
      mask: true,
    });

    that.setData({
      allowDownload: false,
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

    wx.downloadFile({
      url: pdfUrl,
      success(res) {
        that.setData({
          allowDownload: false,
          msgBox2btnTxt: "已下载"
        });
        fsm.copyFileSync(res.tempFilePath, wx.env.USER_DATA_PATH + "/" + fileName);
        wx.shareFileMessage({
          filePath: wx.env.USER_DATA_PATH + "/" + fileName,
          fileName: fileName,
          success: function () {
            that.setData({
              menuCurr: 0
            });
          },
          fail: function () {
            that.setData({
              allowDownload: true,
              msgBox2btnTxt: "下载PDF"
            });
          },
          complete: function () {
            wx.hideLoading({});
          }
        });
      },
      fail: function () {
        that.setData({
          allowDownload: true,
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

  resetZoom() {
    "worklet";
    this.scale.value = defaultCoord.scale;
    this.lastScale.value = defaultCoord.scale;
    this.x.value = defaultCoord.x;
    this.y.value = defaultCoord.y;
  },



});