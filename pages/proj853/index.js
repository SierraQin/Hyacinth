// pages/proj853/index.js

import {
  GestureState
} from "./workletUi.js";

const {
  Base64
} = require('js-base64');

const {
  shared,
  spring
} = wx.worklet;

Page({
  data: {
    svgUri: "https://metro-1252278458.cos.ap-beijing.myqcloud.com/svg/MTR2.4.1.svg"
  },

  onLoad(options) {
    const that = this;

    wx.showLoading({
      title: "数据加载中",
      mask: true
    });
    wx.request({
      url: "https://metro-1252278458.cos.ap-beijing.myqcloud.com/svg/MTR2.4.1.svg",
      method: "GET",
      success: function (r) {
        let prodSvg = "data:image/svg+xml;base64," + Base64.encode(r.data);
        that.setData({
          svgUri: prodSvg,
        });
        wx.hideLoading({});
      },
    });

    // https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/gesture.html

    const x = shared(0);
    const y = shared(0);
    const scale = shared(1);
    this.applyAnimatedStyle('.svgMain', () => {
      "worklet";
      return {
        transform: `translate(${x.value}px, ${y.value}px) scale(${ scale.value })`,
      };
    });
    this.x = x;
    this.y = y;
    this.scale = scale
    this.lastScale = shared(1)
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
  },

  handleScale(evt) {
    "worklet";
    this.scale.value = evt.scale * this.lastScale.value;
  },

  handleDrag(evt) {
    "worklet";
    if (evt.state === GestureState.ACTIVE) {
      this.x.value += evt.focalDeltaX * this.lastScale.value;
      this.y.value += evt.focalDeltaY * this.lastScale.value;
    }
  },

  reset() {
    "worklet";
    this.scale.value = 1;
    this.lastScale.value = 1;
    this.x.value = 0;
    this.y.value = 0;
  },



});