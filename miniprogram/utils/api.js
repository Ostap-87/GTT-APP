// Связь с сервером: вход через WeChat (wx.login → /api/wx/login), загрузка визита, файлы, оплата.
const config = require('../config');
const { t, pick } = require('./i18n');
const fmt = require('./format');

const state = () => getApp().globalData;
let sessionPromise = null;

function call(method, path, data, token) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: config.API_BASE + path,
      method,
      data,
      timeout: 15000,
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data);
        else reject({ status: res.statusCode, code: res.data && res.data.error, message: res.data && res.data.message });
      },
      fail(err) {
        reject({ status: 0, code: 'network', message: err.errMsg });
      },
    });
  });
}

// Код приглашения приходит в ссылке (?i=...) или в QR-коде мини-программы (?scene=...).
function captureQuery(query) {
  if (!query) return;
  const s = state();
  const code = query.i || (query.scene ? decodeURIComponent(query.scene) : '');
  if (code && code !== s.lastInvite) {
    s.invite = code;
    s.lastInvite = code;
    s.sessionReady = false;
  }
  if (query.v) s.visitId = query.v;
}

function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (r) => (r.code ? resolve(r.code) : reject({ code: 'wx_login' })),
      fail: (e) => reject({ code: 'wx_login', message: e.errMsg }),
    });
  });
}

function pickVisit(visits) {
  const today = fmt.today();
  const next = visits.find((v) => v.date >= today);
  const last = visits[visits.length - 1];
  return (next || last || {}).id || null;
}

function ensureSession() {
  const s = state();
  if (s.sessionReady) return Promise.resolve(s);
  if (sessionPromise) return sessionPromise;
  const invite = s.invite;
  sessionPromise = wxLogin()
    .then((code) => Promise.all([
      call('POST', '/api/wx/login', { code, invite: invite || undefined }),
      call('GET', '/api/wx/config').catch(() => ({ templates: {}, payEnabled: false })),
    ]))
    .then(([res, cfg]) => {
      s.token = res.token;
      s.visits = res.visits || [];
      s.config = cfg;
      s.inviteError = res.inviteError || null;
      if (s.invite === invite) s.invite = null;
      if (res.joined) s.visitId = res.joined;
      if (!s.visits.some((v) => v.id === s.visitId)) s.visitId = pickVisit(s.visits);
      s.visit = null;
      s.share = null;
      s.sessionReady = true;
      sessionPromise = null;
      return s;
    }, (err) => {
      sessionPromise = null;
      throw err;
    });
  return sessionPromise;
}

function request(method, path, data) {
  return ensureSession()
    .then((s) => call(method, path, data, s.token))
    .catch((err) => {
      if (err.status !== 401) throw err;
      state().sessionReady = false; // токен истёк — входим заново один раз
      return ensureSession().then((s) => call(method, path, data, s.token));
    });
}

function prepareShare(visit) {
  request('POST', `/api/wx/visits/${visit.id}/share`, {})
    .then((r) => { state().share = r; })
    .catch(() => {});
}

function loadVisit(force) {
  return ensureSession().then((s) => {
    if (!s.visitId) throw { code: s.inviteError || 'no_visit' };
    const fresh = s.visit && s.visit.id === s.visitId && Date.now() - s.visitAt < 20000;
    if (fresh && !force) return s.visit;
    return request('GET', `/api/wx/visits/${s.visitId}`).then((v) => {
      s.visit = v;
      s.visitAt = Date.now();
      if (v.can && v.can.share && !s.share) prepareShare(v);
      if (!(v.can && v.can.share)) wx.hideShareMenu({ fail() {} });
      return v;
    });
  });
}

function upload(visitId, filePath, name) {
  return ensureSession().then((s) => new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${config.API_BASE}/api/wx/visits/${visitId}/materials`,
      filePath,
      name: 'file',
      formData: { name },
      header: { Authorization: `Bearer ${s.token}` },
      success(res) {
        let data = {};
        try { data = JSON.parse(res.data || '{}'); } catch (e) { data = {}; }
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
        else reject({ status: res.statusCode, code: data.error, message: data.message });
      },
      fail(err) { reject({ status: 0, code: 'network', message: err.errMsg }); },
    });
  }));
}

function openGuestList(visitId) {
  return ensureSession().then((s) => new Promise((resolve, reject) => {
    wx.downloadFile({
      url: `${config.API_BASE}/api/wx/visits/${visitId}/guest-list.xlsx`,
      header: { Authorization: `Bearer ${s.token}` },
      success(res) {
        if (res.statusCode !== 200) return reject({ status: res.statusCode, code: 'download' });
        wx.openDocument({ filePath: res.tempFilePath, fileType: 'xlsx', showMenu: true, success: resolve, fail: reject });
      },
      fail(err) { reject({ status: 0, code: 'network', message: err.errMsg }); },
    });
  }));
}

function shareMessage() {
  const s = state();
  const v = s.visit;
  const lang = s.lang;
  if (!v) return { title: 'Global Tech Tour', path: '/pages/visit/index' };
  return {
    title: `${pick(v.trip, lang)} · ${pick(v.company, lang)} ${fmt.shortDate(v.date, lang)}`,
    path: s.share ? s.share.path : '/pages/visit/index',
  };
}

function errorText(err, lang) {
  const L = t(lang);
  const code = err && err.code;
  if (code === 'invite_invalid') return L.inviteInvalid;
  if (code === 'no_visit' || code === 'not_member') return L.noVisit;
  if (code === 'host_only') return L.hostOnly;
  if (code === 'network' || code === 'wx_login' || !err || !err.status) return L.loadError;
  return (err && err.message) || L.loadError;
}

function lang() { return state().lang; }

function setLang(value) {
  state().lang = value;
  wx.setStorageSync('lang', value);
}

module.exports = {
  captureQuery, ensureSession, request, loadVisit, upload, openGuestList, shareMessage, errorText, lang, setLang,
  get: (path) => request('GET', path),
  post: (path, data) => request('POST', path, data || {}),
  settings: () => state().config || { templates: {}, payEnabled: false },
};
