// pages/orgchart/index.js


import {
  localData
} from "./localData.js";

const app = getApp();

var tier2Data = {};
var prevScrollTop = 0;

Page({
  data: {
    tabBlockHeight: 200,
    rowHeight: 200,
    titleWidth: 200,
    tabBlockTop: 200,

    tier2Data: {},
    lineDic: [],
    lineIdList_byLine: [],
    lineIdList_byTier3: [],

    tabCurr: 0,
    tabList: ["线路", "站区", "搜索"],

    tab0_sideBarCurr: 0,
    tab0_offsetList: [],
    tab0_scrollTop: 0
  },

  onLoad() {
    this.preparData();

  },

  onReady() {

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
      let tabBlockHeight = app.globalData.systemInfo.screenHeight - res[0].top - 20 / 750 * app.globalData.systemInfo.screenWidth;
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

  preparData() {
    let d = localData.tier2Data;
    let lineIdList_byLine = [];
    let lineIdList_byTier3 = [];

    Object.keys(d.lines).forEach((value, index, array) => {
      let lineCurr = parseInt(value);
      let lineT3List = [];
      let lineT3Curr = NaN;
      let lineT3Prev = "";

      d.lines[value].sta.forEach((v, i, a) => {
        // 计算站区管界内连续的车站以便显示
        let curr = v.status == 1 ? v.status.toString() : v.status + v.t3;
        if (lineT3Prev == curr) {
          lineT3List[lineT3List.length - 1].staLen += 1;
        } else {
          if (v.status == 0) {
            lineT3Curr = {
              t3Key: v.t3,
              lineKey: v.up.toString(),
              staLen: 1,
              name: d.lines[v.up.toString()].tier3[v.t3].name + d.lines[v.up.toString()].tier3[v.t3].suffix,
              hex: d.lines[v.up.toString()].hex,
              dark: d.lines[v.up.toString()].dark
            };
          } else {
            lineT3Curr = {
              t3Key: -1,
              lineKey: "-1",
              staLen: 1,
              name: "非运营",
              hex: "#808080",
              dark: false
            };
          }
          lineT3List.push(lineT3Curr);
        }
        lineT3Prev = curr;

        // 通过处理换乘站相互管辖问题来计算站区管界
        if (v.up == lineCurr) {
          d.lines[value].sta[i].dn.push(lineCurr);
        } else if (v.up > 0) {
          d.lines[v.up.toString()].sta.forEach((tv, ti, ta) => {
            if (tv.name == v.name) {
              tv.dn.push(lineCurr);
            }
          });
        } else {
          return;
        }

        let s = {
          name: v.name,
          id: i
        };
        if (d.lines[v.up.toString()].tier3[v.t3]["lines"][value]) {
          d.lines[v.up.toString()].tier3[v.t3]["lines"][value].push(s);
        } else {
          d.lines[v.up.toString()].tier3[v.t3]["lines"][value] = [s];
        }

      });

      let t2Key = typeof (d.lines[value].t2) == "string" ? d.lines[value].t2 : d.lines[value].t2.t2Key;
      d.lines[value].id = lineCurr;
      d.lines[value].staLen = d.lines[value].sta.length;
      d.lines[value].tier3Len = Object.keys(d.lines[value].tier3).length;
      console.log(t2Key)
      d.lines[value].type != 1 ? d.lines[value].t2 = d.tier2[t2Key] : NaN;
      d.lines[value].type != 1 ? d.lines[value].t2.t2Key = t2Key : NaN;

      d.lines[value].type == 0 ? d.lines[value].staT3List = lineT3List : NaN;
      d.lines[value].type == 0 ? lineIdList_byLine.push(value) : NaN;
      d.lines[value].type != 1 ? lineIdList_byTier3.push(value) : NaN;
    });

    tier2Data = d;
    this.setData({
      tier2Data,
      //tier2Dic: tier2Data.tier2,
      lineDic: d.lines,
      lineIdList_byLine,
      lineIdList_byTier3
    }, () => {
      this.setLayoutVars();
    });

    console.log(this.data);
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

    this.setData({
      tab0_sideBarCurr: id,
      tab0_scrollTop: this.data.tab0_offsetList[id]
    });
  },

  onTab0Scroll(evt) {
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