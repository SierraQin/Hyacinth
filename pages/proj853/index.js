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

var defaultCoord = {
  x: 318,
  y: 728,
  scale: 20
};


Page({
  data: {
    isDev: false,
    svgProd: "https://static.qinxr.cn/proj853/prod.svg",
    svgDev: "https://mtr.qinxr.cn/src/MTR2.svg"
  },

  onLoad(options) {
    const that = this;






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

    console.log("x: " + this.x.value + ", y: " + this.y.value + ", z: " + this.scale.value);
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