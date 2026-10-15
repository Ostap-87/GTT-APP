// Мини-программа Global Tech Tour для принимающей стороны: страница визита делегации.
const api = require('./utils/api');

function systemLang() {
  try {
    const info = wx.getAppBaseInfo ? wx.getAppBaseInfo() : wx.getSystemInfoSync();
    return /^zh/i.test(info.language || 'zh') ? 'zh' : 'en';
  } catch (e) {
    return 'zh';
  }
}

App({
  globalData: {
    lang: 'zh',
    invite: null,
    lastInvite: null,
    visitId: null,
    visit: null,
    visits: [],
    token: null,
    config: null,
    share: null,
    sessionReady: false,
  },

  onLaunch(options) {
    this.globalData.lang = wx.getStorageSync('lang') || systemLang();
    api.captureQuery(options && options.query);
  },

  onShow(options) {
    api.captureQuery(options && options.query);
  },
});
