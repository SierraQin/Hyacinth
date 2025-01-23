// pages/farecalc/pro/index.js

import Toast, {
  hideToast
} from 'tdesign-miniprogram/toast/index';

const app = getApp();

var raw = NaN;
var verInfo = NaN;

var nodeMap = {};
var nodeDic = {};
var epMap = {};
var lineInSta = {};


function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

function sta2id(staName) {
  return raw.staToId.indexOf(staName);
};

function id2sta(staId) {
  try {
    return raw.staToId[parseInt(staId)];
  } catch {
    return "ERROR"
  }
};

function getEntryPointByLineSta(lineId, staId) {
  lineId = parseInt(lineId);
  staId = parseInt(staId);

  if (lineId == 93 && staId == 61) {
    lineId = 4;
  } else if (lineId == 90 && staId == 222) {
    lineId = 10;
  } else if (lineId == 90 && staId == 208) {
    lineId = 10;
  }

  for (var u in epMap) {
    if (epMap[u].staId == staId && epMap[u].lines.indexOf(lineId) > -1) {
      return u;
    }
  }

  return NaN;
};

function getCmd(filter, cmdStrList) {
  let rtn = [];
  cmdStrList.forEach((v) => {
    if (v[0] == filter) {
      rtn.push(v.slice(1));
    }
  });
  return rtn;
};



Page({
  data: {
    freeDis: -1,
    cmdList: [],
    verInfo: {
      ver: "",
      date: ""
    },

    route_valid: false,


    cas_options: NaN,
    cas_subTitles: ["选择线路", "选择车站"],
    cas_note: ["选择起点站", "选择终点站", "选择终点站(第二段)"],
    cas_visible: [false, false, false],

    cas_curr: [40080, 140280, 930091],

    route2_: false,
    route2_enabled: false,
    cas_note_r2: "",




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
      url: "https://static.qinxr.cn/Hyacinth/fareCalcPro.json",
      timeout: 15000,
      dataType: "json",

      success: (res) => {
        raw = res.data.data;

        let date = new Date(res.data.lastModified * 1000);
        let d = `${date.getFullYear().toString()}年${(date.getMonth()+1).toString()}月${date.getDate().toString()}日 ${date.getHours().toString()}:${date.getMinutes().toString()}:${date.getSeconds().toString()}`;

        verInfo = {
          ver: res.data.ver,
          date: d
        };


        that.setData({
          freeDis: raw.freeDis,
          cmdList: raw.cmdList
        }, () => {
          that.buildMap();

          hideToast({
            context: this,
            selector: '#toast-loading',
          });



        });


      }

    });


  },


  buildMap() {
    const that = this;

    let temp = [];
    let tempMap = {};

    nodeMap = {};
    nodeDic = {};
    epMap = {};

    try {
      // 初始化接入点
      getCmd("拆分虚拟车站", that.data.cmdList).forEach((v) => {
        temp.push(sta2id(v[0]));
      });

      raw.staToId.forEach((v, i, a) => {
        if (temp.indexOf(i) < 0) {
          let u = uuid();
          epMap[u] = {
            enabled: true,
            epConnection: [],
            staId: i,
            name: v,
            lines: [],
            nodes: []
          };
          tempMap[i] = u;
        }
      });


      // 填充接入点
      for (var line in raw.lineDic) {
        raw.lineDic[line].staList.forEach((v) => {
          if (temp.indexOf(v) < 0) {
            epMap[tempMap[v.toString()]].lines.push(parseInt(line));
          } else {
            let u = uuid();
            epMap[u] = {
              enabled: true,
              epConnection: [],
              staId: v,
              name: id2sta(v),
              lines: [parseInt(line)],
              nodes: []
            };
          }
        });
      }


      // 合并虚拟车站
      temp = [];
      getCmd("合并虚拟车站", that.data.cmdList).forEach((v) => {
        temp.push([sta2id(v[0]), v[1]]);
      });

      temp.forEach((v) => {
        v[1].forEach((value) => {
          delete epMap[getEntryPointByLineSta(value, v[0])];
        });
        let u = uuid();
        epMap[u] = {
          enabled: true,
          epConnection: [],
          staId: v[0],
          name: id2sta(v[0]),
          lines: v[1],
          nodes: []
        };
      });


      // 建立单线节点图
      raw.disRaw.forEach((v) => {
        if (!(v[1] in lineInSta)) {
          lineInSta[v[1]] = [v[0]];
        } else if (lineInSta[v[1]].indexOf(v[0]) < 0) {
          lineInSta[v[1]].push(v[0]);
        }

        if (!(v[0] in nodeMap)) {
          nodeMap[v[0]] = {}
        }
        if (!(v[1] in nodeMap[v[0]])) {
          nodeMap[v[0]][v[1]] = {
            uuid: uuid(),
            edges: []
          };
        }
        if (!(v[2] in nodeMap[v[0]])) {
          nodeMap[v[0]][v[2]] = {
            uuid: uuid(),
            edges: []
          };
        }

        nodeMap[v[0]][v[1]].edges.push({
          tEdge: false,
          targetUuid: nodeMap[v[0]][v[2]].uuid,
          line: v[0],
          targetSta: v[2],
          dis: v[3],
          dir: v[4]
        });

        let u = nodeMap[v[0]][v[1]].uuid;
        if (epMap[getEntryPointByLineSta(v[0], v[1])].nodes.indexOf(u) < 0) {
          epMap[getEntryPointByLineSta(v[0], v[1])].nodes.push(u);
        }

      });


      // 自动连接换乘车站的节点
      temp = [];
      getCmd("断开换乘路径", that.data.cmdList).forEach((v) => {
        temp.push(sta2id(v[0]));
      });

      for (var s in lineInSta) {
        if (temp.indexOf(parseInt(s)) > -1 || lineInSta[s].length < 2) {

        } else {
          lineInSta[s].forEach((a) => {
            lineInSta[s].forEach((b) => {
              if (a != b) {
                nodeMap[a][s].edges.push({
                  tEdge: true,
                  targetUuid: nodeMap[b][s].uuid,
                  line: b,
                  targetSta: parseInt(s),
                  dis: 0,
                  dir: NaN
                });
              }
            });
          });
        }
      }


      // 根据命令连接换乘车站的节点
      temp = [];
      getCmd("连接换乘路径", that.data.cmdList).forEach((v) => {
        temp.push([
          sta2id(v[0]),
          v[1],
          sta2id(v[2]),
          v[3]
        ]);
      });

      temp.forEach((v) => {
        nodeMap[v[1]][v[0]].edges.push({
          tEdge: true,
          targetUuid: nodeMap[v[3]][v[2]].uuid,
          line: v[3],
          targetSta: v[2],
          dis: 0,
          dir: NaN
        });
        nodeMap[v[3]][v[2]].edges.push({
          tEdge: true,
          targetUuid: nodeMap[v[1]][v[0]].uuid,
          line: v[1],
          targetSta: v[0],
          dis: 0,
          dir: NaN
        });
      });


      // 根据命令设置接入点为暂缓
      temp = [];
      getCmd("关闭虚拟车站", that.data.cmdList).forEach((v) => {
        temp.push([
          sta2id(v[0]),
          v[1]
        ]);
      });
      temp.forEach((v) => {
        epMap[getEntryPointByLineSta(v[1], v[0])].enabled = false;
      });


      // 根据命令连接接入点(出站换乘)
      temp = [];
      getCmd("虚拟车站换乘", that.data.cmdList).forEach((v) => {
        temp.push([
          sta2id(v[0]),
          v[1],
          sta2id(v[2]),
          v[3]
        ]);
      });
      temp.forEach((v) => {
        let e1u = getEntryPointByLineSta(v[1], v[0]);
        let e2u = getEntryPointByLineSta(v[3], v[2]);
        if (epMap[e1u].epConnection.indexOf(e2u) < 0) {
          epMap[e1u].epConnection.push(e2u);
        }
        if (epMap[e2u].epConnection.indexOf(e1u) < 0) {
          epMap[e2u].epConnection.push(e1u);
        }
      });

      for (var l in nodeMap) {
        for (var s in nodeMap[l]) {
          nodeDic[nodeMap[l][s].uuid] = {
            line: parseInt(l),
            sta: parseInt(s),
            edges: nodeMap[l][s].edges
          };
        }
      }

      // 填入Cascader
      let cas_options = [];
      Object.keys(raw.lineDic).forEach((v) => {
        let lineId = parseInt(v);
        let lineItem = raw.lineDic[v];
        let baseValue = lineId * 10000;
        let l = {
          value: baseValue,
          label: lineItem.name,
          children: []
        };
        lineItem.staList.forEach((v) => {
          l.children.push({
            value: baseValue + v,
            label: id2sta(v)
          });
        });
        cas_options.push(l);
      });

      let cas_note = [];
      that.data.cas_curr.forEach((v, i, a) => {
        let lineIdStr = parseInt(v / 10000).toString();
        let staIdStr = (v % 10000).toString();
        cas_note.push(raw.lineDic[lineIdStr].name + " - " + id2sta(staIdStr));
      });


      that.setData({
        cas_note,
        cas_options
      });


      return true;

    } catch (exp) {
      return false;
    }
  },


  dij(ep1, ep2) {
    const that = this;

    if (ep1 == ep2) {
      return {
        code: -1
      }
    } else if (false) {
      // 检查节点连接数
    }

    let s1 = epMap[ep1].nodes[0];
    let s2 = epMap[ep2].nodes[0];

    let nodeList = Array.from(Object.keys(nodeDic));
    let xlen = nodeList.length;

    let xflag = Array(xlen).fill(false);
    let xdis = Array(xlen).fill(-1);
    let xprev = Array(xlen).fill(-1);
    let xpath = Array(xlen).fill(-1);

    let a1 = nodeList.indexOf(s1);
    let a2 = nodeList.indexOf(s2);

    xdis[a1] = 0;
    xprev[a1] = a1;


    let success = false;
    let tflag = -1;
    for (var kill = 0; kill < 1000; kill += 1) {
      let xdis_min = 10000000;
      let a_min = -1;

      for (var i = 0; i < xlen; i += 1) {
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


      let u = nodeList[a_min];
      let edgeCount = nodeDic[u].edges.length;
      for (var e = 0; e < edgeCount; e += 1) {
        let a = nodeList.indexOf(nodeDic[u].edges[e].targetUuid);
        if (xdis[a] < 0 || xdis[a] > xdis_min + nodeDic[u].edges[e].dis) {
          xdis[a] = xdis_min + nodeDic[u].edges[e].dis;
          xprev[a] = a_min;
          xpath[a] = nodeDic[u].edges[e].line;
        }
      }

    }

    if (!success) {
      return {
        code: -3
      }
    } else {

      let path_node = [a2];
      let path_line = [];
      let path_sta = [];
      let path_dis = [xdis[a2]];

      while (path_node[path_node.length - 1] != a1) {
        path_line.push(xpath[path_node[path_node.length - 1]]);
        path_node.push(xprev[path_node[path_node.length - 1]]);
        path_dis.push(xdis[path_node[path_node.length - 1]]);
        if (xdis[path_node[path_node.length - 1]] == 0) {
          break;
        }
      }
      path_line.push(path_line[path_line.length - 1]);

      if (path_dis[1] == path_dis[0]) {
        path_node.shift();
        path_line.shift();
        path_dis.shift();
      }

      path_node.reverse();
      path_line.reverse();
      path_dis.reverse();


      for (var i in path_node) {
        //path_sta.push(nodeDic[nodeList[path_node[i]]].sta);
        path_sta.push(id2sta(nodeDic[nodeList[path_node[i]]].sta));
        path_node[i] = nodeList[path_node[i]];
      }


      return {
        code: 0,
        path: {
          lineId: path_line,
          staId: path_sta,
          nodeUuid: path_node,
          dis: path_dis
        },
        dis: xdis[a2],
        fare: that.getTicketFare(xdis[a2])
      };
    }

  },


  showRes() {
    const that = this;

    try {
      let s1 = getEntryPointByLineSta(
        parseInt(that.data.cas_curr[0]) / 10000,
        parseInt(that.data.cas_curr[0]) % 10000
      );
      let s2 = getEntryPointByLineSta(
        parseInt(that.data.cas_curr[1]) / 10000,
        parseInt(that.data.cas_curr[1]) % 10000
      );
      let s3 = getEntryPointByLineSta(
        parseInt(that.data.cas_curr[2]) / 10000,
        parseInt(that.data.cas_curr[2]) % 10000
      );

      let res = that.dij(s1, s2);
      console.log(res);
    } catch (exp) {
      console.log(exp);
    }
  },


  getTicketFare(dis) {
    const that = this;
    dis -= this.data.freeDis;
    if (dis <= -that.data.freeDis) {
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


  showCascader(evt) {
    let cas_visible = [false, false];
    let id = parseInt(evt.target.id[5]);
    cas_visible[id] = true;
    this.setData({
      cas_visible
    });
  },


  onCascaderChange(evt) {
    const that = this;
    const {
      selectedOptions,
      value
    } = evt.detail;

    let id = parseInt(evt.target.id[4]);
    let cas_note = [];
    let cas_curr = this.data.cas_curr;

    cas_curr[id] = value;

    try {
      cas_curr.forEach((v, i, a) => {
        let lineIdStr = parseInt(v / 10000).toString();
        let staIdStr = (v % 10000).toString();
        cas_note.push(raw.lineDic[lineIdStr].name + " - " + id2sta(staIdStr));
      });
    } catch (exp) {
      cas_note = ["选择起点站", "选择终点站", "选择终点站(第二段)"];
    }

    // 这里加判断能否激活虚拟换乘逻辑

    that.setData({
      cas_curr,
      cas_note
    }, () => {
      that.showRes();
    });




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