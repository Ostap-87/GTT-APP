// 代表团 — кто приедет: должности и отрасли без телефонов, список для охраны в Excel.
const api = require('../../utils/api');
const { t, fill, pick, applyTabBar } = require('../../utils/i18n');
const fmt = require('../../utils/format');

const INDUSTRIES = ['retail', 'manufacturing', 'investment', 'other'];

Page({
  data: { ready: false, error: '', lang: 'zh', L: t('zh'), head: '', title: '', filters: [], filter: 'all', people: [], canGuestList: false, downloading: false },

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
        const filters = [{ key: 'all', label: L.all, count: v.delegates.length }]
          .concat(INDUSTRIES.filter((k) => v.industries[k]).map((k) => ({ key: k, label: L[`ind_${k}`], count: v.industries[k] })));
        this.setData({
          ready: true,
          error: '',
          head: `${pick(v.company, lang)} · ${fmt.shortDate(v.date, lang)}`,
          title: fill(L.delegation, { n: v.delegates.length }),
          filters,
          canGuestList: Boolean(v.can && v.can.guestList),
        });
        this.applyFilter();
      })
      .catch((err) => this.setData({ ready: true, error: api.errorText(err, lang) }));
  },

  applyFilter() {
    const lang = this.data.lang;
    const f = this.data.filter;
    const people = this.visit.delegates
      .filter((d) => f === 'all' || d.industry === f)
      .map((d) => {
        const role = lang === 'en' ? d.roleEn : d.roleZh;
        const company = lang === 'en' ? d.companyEn : d.companyZh;
        const city = lang === 'en' ? d.cityEn : d.cityZh;
        return { id: d.id, initials: d.initials, nameLatin: d.nameLatin, line: `${role} · ${company}${city ? (lang === 'en' ? `, ${city}` : `（${city}）`) : ''}` };
      });
    this.setData({ people });
  },

  setFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.key });
    this.applyFilter();
  },

  downloadList() {
    if (this.data.downloading) return;
    this.setData({ downloading: true });
    api.openGuestList(this.visit.id)
      .catch((err) => wx.showToast({ title: api.errorText(err, this.data.lang), icon: 'none' }))
      .then(() => this.setData({ downloading: false }));
  },

  retry() {
    getApp().globalData.sessionReady = false;
    this.refresh(true);
  },

  onShareAppMessage() { return api.shareMessage(); },
});
