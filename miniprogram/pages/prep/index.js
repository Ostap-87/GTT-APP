// 问题与资料 — вопросы делегатов на китайском и материалы компании (попадают к делегатам после проверки координатора).
const api = require('../../utils/api');
const { t, fill, pick, applyTabBar } = require('../../utils/i18n');
const fmt = require('../../utils/format');

const EXTENSIONS = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'mp4', 'mov'];

Page({
  data: { ready: false, error: '', lang: 'zh', L: t('zh'), head: '', questionsTitle: '', questions: [], materials: [], canUpload: false, uploading: false },

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
        this.setData({
          ready: true,
          error: '',
          head: `${pick(v.company, lang)} · ${fmt.shortDate(v.date, lang)}`,
          questionsTitle: fill(L.questions, { n: v.questions.length }),
          questions: v.questions.map((q) => ({ id: q.id, text: pick(q, lang), author: pick(q.author, lang) })),
          materials: v.materials.map((m) => ({
            id: m.id,
            name: m.name,
            ext: fmt.fileExt(m.name),
            size: fmt.sizeLabel(m.sizeMb),
            statusText: m.status === 'published' ? L.published : L.review,
            tone: m.status === 'published' ? 'ok' : 'warn',
          })),
          canUpload: Boolean(v.can && v.can.upload),
        });
      })
      .catch((err) => this.setData({ ready: true, error: api.errorText(err, lang) }));
  },

  upload() {
    if (this.data.uploading) return;
    wx.chooseMessageFile({
      count: 1,
      type: 'all',
      extension: EXTENSIONS,
      success: (res) => {
        const file = res.tempFiles[0];
        this.setData({ uploading: true });
        api.upload(this.visit.id, file.path, file.name)
          .then(() => {
            wx.showToast({ title: this.data.L.uploaded, icon: 'none' });
            return this.refresh(true);
          })
          .catch((err) => wx.showToast({ title: api.errorText(err, this.data.lang), icon: 'none' }))
          .then(() => this.setData({ uploading: false }));
      },
    });
  },

  retry() {
    getApp().globalData.sessionReady = false;
    this.refresh(true);
  },

  onShareAppMessage() { return api.shareMessage(); },
});
