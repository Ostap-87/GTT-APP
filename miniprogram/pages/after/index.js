// 访问后 — оценка группы и запросы на продолжение. Контакты — только с согласия делегата, ответ — через координатора.
const api = require('../../utils/api');
const { t, fill, pick, applyTabBar } = require('../../utils/i18n');
const fmt = require('../../utils/format');

Page({
  data: {
    ready: false, error: '', lang: 'zh', L: t('zh'), head: '',
    rating: null, requestsTitle: '', requests: [], canReply: false,
    sheet: false, targets: [], targetIndex: 0, text: '', sending: false,
  },

  onShow() { this.refresh(); },

  onPullDownRefresh() { this.refresh(true).then(() => wx.stopPullDownRefresh()); },

  refresh(force) {
    const lang = api.lang();
    const L = t(lang);
    this.setData({ lang, L });
    applyTabBar(lang);
    return api.loadVisit(force)
      .then((v) => {
        this.visit = v;
        const f = v.feedback;
        const requests = (v.requests || []).map((r) => ({
          id: r.id,
          nameLatin: r.nameLatin,
          company: pick(r.company, lang),
          text: pick(r, lang),
          consent: r.consent,
          contact: r.contact,
        }));
        this.setData({
          ready: true,
          error: '',
          head: `${pick(v.company, lang)} · ${fmt.shortDate(v.date, lang)}`,
          rating: f && f.count ? { avg: f.avg, count: fill(L.rated, { n: f.count }), top: f.top ? fill(L.top, { x: pick(f.top, lang) }) : '' } : null,
          requestsTitle: fill(L.requests, { n: requests.length }),
          requests,
          canReply: Boolean(v.can && v.can.reply),
          targets: [L.general].concat(requests.map((r) => r.nameLatin)),
        });
      })
      .catch((err) => this.setData({ ready: true, error: api.errorText(err, lang) }));
  },

  showContact(e) {
    const r = this.data.requests.find((x) => x.id === e.currentTarget.dataset.id);
    if (!r || !r.contact) return;
    const L = this.data.L;
    wx.showModal({
      title: `${r.nameLatin} · ${L.contact}`,
      content: r.contact.email,
      confirmText: L.copyContact,
      cancelText: L.cancel,
      success: (res) => {
        if (res.confirm) wx.setClipboardData({ data: r.contact.email });
      },
    });
  },

  openReply() { this.setData({ sheet: true, targetIndex: 0, text: '' }); },
  closeReply() { this.setData({ sheet: false }); },
  onTarget(e) { this.setData({ targetIndex: Number(e.detail.value) }); },
  onText(e) { this.setData({ text: e.detail.value }); },

  sendReply() {
    const text = this.data.text.trim();
    if (!text || this.data.sending) return;
    const target = this.data.targetIndex > 0 ? this.data.requests[this.data.targetIndex - 1] : null;
    this.setData({ sending: true });
    api.post(`/api/wx/visits/${this.visit.id}/replies`, { requestId: target ? target.id : null, text })
      .then(() => {
        this.setData({ sheet: false, sending: false });
        wx.showToast({ title: this.data.L.replySent, icon: 'none' });
      })
      .catch((err) => {
        this.setData({ sending: false });
        wx.showToast({ title: api.errorText(err, this.data.lang), icon: 'none' });
      });
  },

  retry() {
    getApp().globalData.sessionReady = false;
    this.refresh(true);
  },

  onShareAppMessage() { return api.shareMessage(); },
});
