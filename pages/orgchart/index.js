// pages/orgchart/index.js

import Toast, {
  hideToast
} from 'tdesign-miniprogram/toast/index';

const app = getApp();

var rawData = NaN;

var prevScrollTop = 0;
var scrollSourseFlag = false;

var lineToTier2 = {};

Page({
  data: {
    rpx2px: app.globalData.rpx2px,

    tabBlockHeight: 200,
    rowHeight: 200,
    titleWidth: 200,
    tabBlockTop: 200,
    minHeightAboveFooter: 150,

    tier2List: [],
    tier2Dic: {},
    lineList: [],
    lineDic: {},

    tabCurr: 0,
    tabList: ["线路", "机构", "关于"],
    dialogConfirmBtn: {
      content: "返回",
      variant: "base"
    },

    showDialog: false,

    tab0_sideBarCurr: 0,
    tab0_offsetList: [],
    tab0_titleOffset: 0,
    tab0_scrollTop: 0,

    tab2_author: "",
    tab2_date: "",
    tab2_ver: "",
    tab2_infoList: [],

    tab3_t3Path: ["y3", "m2", "西直门站区"],
    tab3_data: {},
    tab3_navBack: 0,
    tab3_mainBarWidth: 50,

  },

  onLoad() {
    const that = this;

    Toast({
      context: this,
      selector: '#toast-loading',
      duration: -1,
      message: '同步数据中...',
      theme: 'loading',
      direction: 'column',
      preventScrollThrough: true,
    });

    wx.request({
      url: "https://static.qinxr.cn/Hyacinth/orgchart.json",
      timeout: 15000,
      dataType: "json",
      success: (res) => {
        rawData = res.data;
        that.preparData_v2();
      },
      fail: (res) => {
        hideToast({
          context: this,
          selector: '#toast-loading',
        });
        that.setData({
          showDialog: true,
        });
      }
    })




  },

  onReady() {
    const that = this;
    const sq = wx.createSelectorQuery();
    sq.select("#tabPanel").boundingClientRect();
    sq.selectViewport().scrollOffset();
    sq.exec((res) => {
      let tabBlockHeight = app.globalData.systemInfo.screenHeight - res[0].top - 20 / 750 * app.globalData.systemInfo.screenWidth - 10;
      let tabBlockTop = res[0].top;
      that.setData({
        tabBlockHeight,
        tabBlockTop
      }, () => {});
    });
  },

  setLayoutVars() {
    const that = this;
    let p = app.globalData.systemInfo.screenWidth / 750;

    let rowHeight = parseInt(p * 50);
    let titleWidth = parseInt(p * 180) + parseInt(p * 300);

    const sq = wx.createSelectorQuery();
    sq.select("#tabPanel").boundingClientRect();
    sq.selectViewport().scrollOffset();
    sq.exec((res) => {
      let tabBlockHeight = app.globalData.systemInfo.screenHeight - res[0].top - 20 / 750 * app.globalData.systemInfo.screenWidth - 10;
      let tabBlockTop = res[0].top;
      that.setData({
        tabBlockHeight,
        tabBlockTop,
        rowHeight,
        titleWidth
      }, () => {
        this.setScrollOffset();
      });
    });
  },


  preparData_v2() {
    let raw = rawData.t2Dic;

    let lineListTemp = [];
    let lineList = [];
    let lineDic = {};


    Object.keys(raw).forEach((value, index, array) => {
      Object.keys(raw[value].lines).forEach((v, i, a) => {
        lineToTier2[v] = value;

        raw[value].lines[v].t2 = value;
        raw[value].lines[v].t2Name = raw[value].name;
        lineDic[v] = raw[value].lines[v];
        if (!raw[value].lines[v].hidden) {
          lineListTemp.push({
            idx: raw[value].lines[v].idx,
            tagName: v
          });
        }
      });
    });


    lineListTemp.sort((a, b) => a.idx - b.idx);
    lineListTemp.forEach((value, index, array) => {
      lineList.push(value.tagName);
    });

    // 计算站区管界内连续的车站以便显示
    Object.keys(lineDic).forEach((value, index, array) => {
      let lineT3List = [];
      let lineT3Curr = NaN;
      let lineT3Prev = NaN;

      lineDic[value].sta.forEach((v, i, a) => {
        if (v[2] == lineT3Prev) {
          lineT3Curr.staLen += 1;
        } else {
          if (lineT3Curr != NaN) {
            lineT3List.push(lineT3Curr);
          }
          lineT3Curr = {
            line: v[3],
            hex: lineDic[v[3]].hex,
            dark: lineDic[v[3]].dark,
            name: v[2],
            staLen: 1,
            t2: lineDic[v[3]].t2,
          }
        }
        lineT3Prev = v[2];
      });
      lineT3List.push(lineT3Curr);
      lineT3List.shift();

      lineDic[value].tab0_t3List = lineT3List;
    });


    let tier2List = Object.keys(raw);
    let tier2Dic = {};

    let date = new Date(rawData.timeStamp * 1000);
    let d = `${date.getFullYear().toString()}年${(date.getMonth()+1).toString()}月${date.getDate().toString()}日 ${date.getHours().toString()}:${date.getMinutes().toString()}:${date.getSeconds().toString()}`;
    console.log(rawData)

    tier2List.forEach((value, index, array) => {
      tier2Dic[value] = {
        t3List: [],
        suffix: raw[value].suffix,
        name: raw[value].name,
        aka: raw[value].aka,
        type: raw[value].type,
        loc: raw[value].loc,
        lineList: [],
        lineDic: {},
      };
      Object.keys(raw[value].lines).forEach((v, i, a) => {
        raw[value].lines[v].hidden ? NaN : tier2Dic[value].lineList.push(v);
        tier2Dic[value].lineDic[v] = {
          key: v,
          name: raw[value].lines[v].name,
          hex: raw[value].lines[v].hex,
          dark: raw[value].lines[v].dark,
          hidden: raw[value].lines[v].hidden
        };
        Object.keys(raw[value].lines[v].t3Dic).forEach((t3) => {
          let t = raw[value].lines[v].t3Dic[t3];
          t.t2 = value;
          t.line = v;
          t.name = t3;
          t.len = t.iSta.length + t.eSta.length;
          tier2Dic[value].t3List.push(t);
        });
      });
    });


    this.setData({
      lineList,
      lineDic,
      tier2List,
      tier2Dic,

      tab2_author: rawData.author,
      tab2_time: d,
      tab2_ver: rawData.ver,
      tab2_infoList: rawData.infoList,
    }, () => {
      this.setLayoutVars();
      hideToast({
        context: this,
        selector: '#toast-loading',
      });
    });

  },

  setScrollOffset() {
    const that = this;

    wx.createSelectorQuery().selectAll(".tab0-anchor").boundingClientRect((res) => {
      let o = parseInt(res[0].top);
      let tab0_offsetList = res.map((r) => r.top - o);
      that.setData({
        tab0_offsetList
      });
    }).exec();

    wx.createSelectorQuery().select("#tab0-title").boundingClientRect((res) => {
      let tab0_titleOffset = res.height + app.globalData.systemInfo.screenWidth * 0.06;
      that.setData({
        tab0_titleOffset
      });
    }).exec();
  },


  navToTier3(evt) {
    const that = this;
    let data = evt.target.dataset;
    let raw = rawData.t2Dic;

    if (raw[data.t2].lines[data.line].hidden) {
      return;
    }

    let xt2 = raw[data.t2];
    let xline = xt2.lines[data.line];
    let xt3 = xline.t3Dic[data.t3];

    let tab3_t3Path = [data.t2, data.line, data.t3];
    let tab3_data = {
      name: data.t3,
      t2: {
        name: xt2.name,
        suffix: xt2.suffix
      },
      line: {
        name: xline.name,
        hex: xline.hex,
        dark: xline.dark,
      },
      iStaCount: xt3.iSta.length,
      eStaCount: xt3.eSta.length,
      iSta: [],
      eSta: []
    };

    xt3.iSta.forEach((value, index, array) => {
      tab3_data.iSta.push({
        name: value[0],
        status: value[1]
      });
    });

    xt3.eSta.forEach((value, index, array) => {
      let l = raw[lineToTier2[value[2]]].lines[value[2]];
      tab3_data.eSta.push({
        name: value[0],
        status: value[1],
        line: {
          key: value[2],
          name: l.name,
          hex: l.hex,
          dark: l.dark,
          hidden: l.hidden
        }
      });
    });

    that.setData({
        tab3_navBack: this.data.tabCurr,
        tab3_t3Path,
        tab3_data
      },
      () => {
        that.setData({
          tabCurr: 3
        }, () => {
          wx.createSelectorQuery().select("#tab3_mainLineTitle").boundingClientRect((res) => {
            that.setData({
              tab3_mainBarWidth: res.width + 1
            });
          }).exec();
        });
      });
  },

  onTabsChange(evt) {
    this.setData({
      tabCurr: evt.detail.value
    }, () => {
      this.setData({
        tab0_scrollTop: prevScrollTop
      });
    });
  },

  onTab0SideBarChange(evt) {
    let id = parseInt(evt.detail.value);
    scrollSourseFlag = true;

    this.setData({
      tab0_sideBarCurr: id,
      tab0_scrollTop: this.data.tab0_offsetList[id] + this.data.tab0_titleOffset
    });
  },

  onTab0Scroll(evt) {
    if (scrollSourseFlag) {
      scrollSourseFlag = false;
      return;
    }
    prevScrollTop = evt.detail.scrollTop;
    if (prevScrollTop < 0) {
      this.setData({
        tab0_sideBarCurr: 0
      });
      return;
    }

    let offset = app.globalData.systemInfo.screenWidth / 750 * 25;
    let tab0_sideBarCurr = this.data.tab0_offsetList.findLastIndex((value, index, array) => prevScrollTop > value - offset);
    if (tab0_sideBarCurr >= 0) {
      this.setData({
        tab0_sideBarCurr
      });
    }
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

  navBackHandler() {
    if (this.data.tabCurr == 3) {
      this.setData({
        tabCurr: this.data.tab3_navBack
      }, () => {
        this.setData({
          tab0_scrollTop: prevScrollTop
        });
      });
    } else {
      wx.navigateBack({
        fail: () => {
          wx.navigateTo({
            url: "/pages/index/index",
          });
        }
      });
    }

  }


})