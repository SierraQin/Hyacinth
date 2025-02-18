// pages/farecalc/index.js

import Toast, {
  hideToast
} from 'tdesign-miniprogram/toast/index';

const app = getApp();

var rawData = NaN;

var staDict = NaN;
var staToId = NaN;
var staKeys = NaN;
var staCount = NaN;

var casLineSta = [];


function nid2aid(n) {
  return staKeys.indexOf(n.toString());
};

function name2nid(s) {
  return staToId[s] ? staToId[s] : -1;
};

function nid2name(n) {
  return rawData.staDict[n.toString()].name;
};

Page({
  data: {
    freeDis: 0,
    vit_enabled: false,
    calcRules: [""],


    cas_options: casLineSta,
    cas_subTitles: ["选择线路", "选择车站"],
    cas_note: ["选择起点站", "选择终点站"],
    cas_visible: [false, false],

    cas_curr: ["900176", "40047"],
    sta_curr: [-1, -1],
    route_valid: false,

    route_start: "默认",
    route_list: [],
    route_dis: 0,
    route_fare: 0,

    footer: app.globalData.guiText.footer,
    loadingFailDialogTitle: app.globalData.guiText.loadingFailDialogTitle,
    loadingFailDialogContent: app.globalData.guiText.loadingFailDialogContent,
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
      url: "https://static.qinxr.cn/Hyacinth/farecalc.json",
      timeout: 15000,
      dataType: "json",
      success: (res) => {
        rawData = res.data;
        staDict = rawData.staDict;
        staToId = rawData.staToId;
        staKeys = Object.keys(staDict);
        staCount = staKeys.length;

        let date = new Date(rawData.timeStamp * 1000);
        let d = `${date.getFullYear().toString()}年${(date.getMonth()+1).toString()}月${date.getDate().toString()}日 ${date.getHours().toString()}:${date.getMinutes().toString()}:${date.getSeconds().toString()}`;

        that.setData({
          ver: rawData.ver,
          updateTime: d,
          freeDis: rawData.freeDis,
          vit_enabled: rawData.mainRegion.vitEnabled,
        }, () => {
          hideToast({
            context: this,
            selector: '#toast-loading',
          });
        });

        let calcRules = [];
        rawData.rules.forEach((rulz) => {
          calcRules.push(rulz.replace("%FREE_DIS%", +that.data.freeDis.toString()));
        });

        that.dumpStaToCascader();


        that.setCurrSta(0, that.data.cas_curr[0]);
        that.setCurrSta(1, that.data.cas_curr[1]);
        that.setData({
          calcRules,
          cas_note: [
            that.getCasNote(that.data.cas_curr[0]),
            that.getCasNote(that.data.cas_curr[1])
          ]
        });

        that.showRes();

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
    });




  },

  setCurrSta(i, casid) {
    let nid = parseInt(casid) % 10000;
    if (!Object.keys(rawData.staDict).includes(nid.toString())) {
      this.setData({
        route_valid: false
      });
      return;
    }
    let sta_curr = this.data.sta_curr;
    sta_curr[i] = nid;
    this.setData({
      sta_curr,
      route_valid: sta_curr[0] != sta_curr[1]
    });
  },

  getCasNote(casId) {
    let lineId = parseInt(casId / 10000).toString();
    let staNid = (casId % 10000).toString();

    return rawData.lineDetail[lineId].name + " - " + nid2name(staNid);
  },

  dumpStaToCascader() {
    casLineSta = [];
    rawData.mainRegion.lines.forEach((value, index, array) => {
      let lineItem = rawData.lineDetail[value.toString()];
      let baseValue = value * 10000;
      let l = {
        value: baseValue.toString(),
        label: lineItem.name,
        children: []
      };
      lineItem.staList.forEach((v, i, a) => {
        l.children.push({
          value: (baseValue + v).toString(),
          label: nid2name(v)
        });
      });
      casLineSta.push(l);
    });

    this.setData({
      cas_options: casLineSta
    });
  },

  getPrice(dis) {
    dis -= this.data.freeDis;
    if (dis <= -this.data.freeDis) {
      return 3;
    } else if (dis <= 6000) {
      return 3;
    } else if (dis <= 12000) {
      return 4;
    } else if (dis <= 22000) {
      return 5;
    } else if (dis <= 32000) {
      return 6;
    } else {
      return parseInt((dis - 32000) / 20000 + 7);
    }
  },

  dij(n1, n2) {
    const that = this;

    try {

      if (n1 == n2) {
        return {
          code: -1
        };
      } else if (staDict[n2].edges.length < 1) {
        return {
          code: -2
        };
      }

      let xflag = new Array(staCount).fill(false);
      let xdis = new Array(staCount).fill(-1);
      let xprev = new Array(staCount).fill(-1);
      let xpath = new Array(staCount).fill(-1);

      let a1 = nid2aid(n1);
      let a2 = nid2aid(n2);

      xdis[a1] = 0;
      xprev[a1] = a1;

      let success = false;
      for (let kill = 0; kill < 10000; kill++) {
        let xdis_min = 100000;
        let a_min = -1;

        for (let i = 0; i < staCount; i++) {
          if (xflag[i] || xdis[i] < 0) {
            continue;
          } else if (xdis[i] < xdis_min) {
            xdis_min = xdis[i];
            a_min = i;
          }
        }

        xflag[a_min] = true;
        if (xflag[a2]) {
          success = true;
          break;
        }

        // Array.prototype.forEach() 不支持中途停止
        let k = staKeys[a_min];
        let edgeKeys = Object.keys(staDict[k].edges);
        for (let e = 0; e < edgeKeys.length; e++) {
          let nextSta = edgeKeys[e];
          for (let j = 0; j < staDict[k].edges[nextSta].length; j++) {
            let e = staDict[k].edges[nextSta][j];
            if (e.line > 999 && !that.data.vit_enabled.includes(e.line)) {
              continue;
            } else {
              let a = nid2aid(nextSta);
              if (xdis[a] < 0 || xdis[a] > xdis_min + e.dis) {
                xdis[a] = xdis_min + e.dis;
                xprev[a] = a_min;
                xpath[a] = e.line;
              }
            }
          }
        }

      }

      if (!success) {
        return {
          code: -3
        };
      } else {
        let path_sta = [a2];
        let path_line = [];
        while (path_sta[path_sta.length - 1] != a1) {
          path_line.push(xpath[path_sta[path_sta.length - 1]]);
          path_sta.push(xprev[path_sta[path_sta.length - 1]]);
        }
        path_line.push(path_line[path_line.length - 1]);
        path_line.reverse();
        path_sta.reverse();

        for (let i = 0; i < path_sta.length; i++) {
          path_sta[i] = parseInt(staKeys[path_sta[i]]);
        }

        return {
          code: 0,
          path_sta: path_sta,
          path_line: path_line,
          tdis: xdis[a2],
          price: that.getPrice(xdis[a2])
        };

      }

    } catch (exp) {
      return {
        code: -400
      };
    }
  },

  showRes() {
    if (!this.data.route_valid) {
      return;
    }

    let res = this.dij(
      this.data.sta_curr[0],
      this.data.sta_curr[1]
    );
    if (res.code != 0) {
      return;
    }

    let route_start = nid2name(res.path_sta[0]);
    let route_list = [];

    let sta_prev = res.path_sta[0];
    let line_prev = res.path_line[0];
    let d = 0;

    for (let i = 1; i < res.path_line.length; i++) {
      if (res.path_line[i] == line_prev) {
        rawData.staDict[res.path_sta[i - 1].toString()].edges[res.path_sta[i].toString()].forEach((e) => {
          if (e.line == line_prev) {
            d += e.dis;
          }
        });
      } else {
        let {
          name,
          hex,
          dark,
          t1
        } = rawData.lineDetail[line_prev.toString()];
        route_list.push({
          sta: nid2name(res.path_sta[i - 1]),
          line: name,
          dis: d,
          dark,
          hex
        });

        sta_prev = res.path_sta[i - 1];
        line_prev = res.path_line[i];

        rawData.staDict[res.path_sta[i - 1].toString()].edges[res.path_sta[i].toString()].forEach((e) => {
          if (e.line == line_prev) {
            d = e.dis;
          }
        });
      }

      if (i == res.path_line.length - 1) {
        let {
          name,
          hex,
          dark,
          t1
        } = rawData.lineDetail[line_prev.toString()];
        route_list.push({
          sta: nid2name(res.path_sta[i]),
          line: name,
          dis: d,
          dark,
          hex
        });
      }
    }


    this.setData({
      route_start,
      route_list,
      route_fare: res.price,
      route_dis: res.tdis
    });

  },

  showCascader(evt) {
    let cas_visible = [false, false];
    let id = parseInt(evt.target.id[5]);
    cas_visible[id] = true;
    this.setData({
      cas_visible
    });
  },

  onCascaderChange(evt) {
    const {
      selectedOptions,
      value
    } = evt.detail;

    let id = parseInt(evt.target.id[4]);
    let cas_note = this.data.cas_note;
    let cas_curr = this.data.cas_curr;
    cas_note[id] = selectedOptions.map((item) => item.label).join(" - ");
    cas_curr[id] = value;
    this.setData({
      cas_note,
      cas_curr
    });
    this.setCurrSta(id, value);
    this.showRes();
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