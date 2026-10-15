// 概览 — обзор визита: где группа, программа, подтверждение и перенос времени, связь с координатором.
const api = require('../../utils/api');
const { t, fill, pick, applyTabBar } = require('../../utils/i18n');
const fmt = require('../../utils/format');

function initials(name) {
  return String(name || '').split(/\s+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase();
}

Page({
  data: {
    ready: false, error: '', lang: 'zh', L: t('zh'), v: null,
    sheet: false, form: { date: '', start: '', note: '' }, sending: false,
    canSubscribe: false, subscribed: false,
  },

  onLoad(query) {
    api.captureQuery(query);
  },

  onShow() {
    this.refresh();
  },

  onPullDownRefresh() {
    this.refresh(true).then(() => wx.stopPullDownRefresh());
  },

  refresh(force) {
    const lang = api.lang();
    this.setData({ lang, L: t(lang) });
    applyTabBar(lang);
    return api.loadVisit(force)
      .then((visit) => {
        this.visit = visit;
        const templates = api.settings().templates || {};
        this.setData({ ready: true, error: '', v: this.viewModel(visit, lang), canSubscribe: Object.keys(templates).length > 0 });
      })
      .catch((err) => this.setData({ ready: true, v: null, error: api.errorText(err, lang) }));
  },

  viewModel(v, lang) {
    const L = t(lang);
    const tones = { confirmed: 'ok', time_proposed: 'warn' };
    const group = v.group || {};
    const groupTitle = { departed: L.groupDeparted, arrived: L.groupArrived }[group.state] || L.groupPlanned;
    const info = [
      [L.people, pick(v.info && v.info.people, lang)],
      [L.language, pick(v.info && v.info.language, lang)],
      [L.industries, pick(v.info && v.info.industries, lang)],
      [L.focus, pick(v.info && v.info.focus, lang)],
    ].filter((r) => r[1]).map((r) => ({ k: r[0], v: r[1] }));
    const c = v.coordinator || {};
    return {
      trip: pick(v.trip, lang),
      when: `${pick(v.company, lang)} · ${fmt.dateLabel(v.date, lang)}${lang === 'en' ? ' · ' : ''}${v.start}–${v.end}`,
      statusTone: tones[v.status] || 'info',
      statusText: L[`status_${v.status}`] || L.status_pending,
      group: group.state ? { title: groupTitle, sub: group.eta ? fill(L.groupEta, { eta: group.eta }) : '' } : null,
      info,
      program: (v.program || []).map((p) => ({ time: p.time, text: pick(p, lang) })),
      proposal: v.proposal ? fill(L.proposalPending, { date: fmt.shortDate(v.proposal.date, lang), start: v.proposal.start }) : '',
      coordinator: { name: c.name, role: pick(c.role, lang), initials: initials(c.name), wechatId: c.wechatId, phone: c.phone },
      // Подтвердить можно, пока визит не подтверждён и компания не ждёт ответа на своё предложение времени
      canConfirm: Boolean(v.can && v.can.confirm && v.status !== 'confirmed' && !v.proposal),
      canPropose: Boolean(v.can && v.can.proposeTime),
      canShare: Boolean(v.can && v.can.share),
    };
  },

  retry() {
    this.setData({ ready: false });
    getApp().globalData.sessionReady = false;
    this.refresh(true);
  },

  setZh() { this.switchLang('zh'); },
  setEn() { this.switchLang('en'); },
  switchLang(lang) {
    if (lang === this.data.lang) return;
    api.setLang(lang);
    this.refresh();
  },

  confirmVisit() {
    api.post(`/api/wx/visits/${this.visit.id}/confirm`)
      .then(() => { wx.showToast({ title: this.data.L.confirmed }); return this.refresh(true); })
      .catch((err) => wx.showToast({ title: api.errorText(err, this.data.lang), icon: 'none' }));
  },

  openSheet() {
    this.setData({ sheet: true, form: { date: this.visit.date, start: this.visit.start, note: '' } });
  },
  closeSheet() { this.setData({ sheet: false }); },
  onDate(e) { this.setData({ 'form.date': e.detail.value }); },
  onTime(e) { this.setData({ 'form.start': e.detail.value }); },
  onNote(e) { this.setData({ 'form.note': e.detail.value }); },

  submitProposal() {
    if (this.data.sending) return;
    this.setData({ sending: true });
    api.post(`/api/wx/visits/${this.visit.id}/propose-time`, this.data.form)
      .then(() => {
        this.setData({ sheet: false, sending: false });
        wx.showToast({ title: this.data.L.sent });
        return this.refresh(true);
      })
      .catch((err) => {
        this.setData({ sending: false });
        wx.showToast({ title: api.errorText(err, this.data.lang), icon: 'none' });
      });
  },

  // Разовая подписка WeChat: каждое «允许» даёт право на одно уведомление.
  subscribe() {
    const ids = Object.values(api.settings().templates || {}).slice(0, 3);
    if (!ids.length) return;
    wx.requestSubscribeMessage({
      tmplIds: ids,
      success: (res) => {
        const accepted = ids.filter((id) => res[id] === 'accept');
        if (!accepted.length) return;
        api.post('/api/wx/subscriptions', { accepted }).then(() => this.setData({ subscribed: true }));
      },
    });
  },

  copyWechat() {
    wx.setClipboardData({ data: this.data.v.coordinator.wechatId, success: () => wx.showToast({ title: this.data.L.copied }) });
  },

  call() {
    wx.makePhoneCall({ phoneNumber: this.data.v.coordinator.phone });
  },

  onShareAppMessage() {
    return api.shareMessage();
  },
});
