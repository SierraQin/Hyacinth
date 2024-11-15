// pages/orgchart/index.js

import Toast, {
  hideToast
} from 'tdesign-miniprogram/toast/index';

const app = getApp();

var rawData = NaN;

var prevScrollTop = 0;
var scrollSourseFlag = false;

Page({
  data: {
    tabBlockHeight: 200,
    rowHeight: 200,
    titleWidth: 200,
    tabBlockTop: 200,

    tier2Data: {},
    lineDic: [],

    tabCurr: 0,
    tabList: ["线路", "站区", "说明"],
    dialogConfirmBtn: {
      content: "返回",
      variant: "base"
    },

    showDialog: false,

    tab0_sideBarCurr: 0,
    tab0_offsetList: [],
    tab0_scrollTop: 0
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

    let renderingListTemp = [];
    let renderingList = [];
    let lineDic = {};


    Object.keys(raw).forEach((value, index, array) => {
      Object.keys(raw[value].lines).forEach((v, i, a) => {
        raw[value].lines[v].t2 = value;
        raw[value].lines[v].t2Name = raw[value].name;
        lineDic[v] = raw[value].lines[v];
        if (!raw[value].lines[v].hidden) {
          renderingListTemp.push({
            idx: raw[value].lines[v].idx,
            tagName: v
          });
        }
      });
    });


    renderingListTemp.sort((a, b) => a.idx - b.idx);
    renderingListTemp.forEach((value, index, array) => {
      renderingList.push(value.tagName);
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



    this.setData({
      lineDic,
      renderingList
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
      tab0_scrollTop: this.data.tab0_offsetList[id]
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
    wx.navigateBack({
      fail: () => {
        wx.navigateTo({
          url: "/pages/index/index",
        });
      }
    });
  }
})