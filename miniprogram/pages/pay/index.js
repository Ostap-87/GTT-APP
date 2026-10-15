// 微信支付 — оплата заказа (WeChat Pay JSAPI). Открывается ссылкой /pages/pay/index?o=<id заказа>.
// Пока у компании нет торгового счёта WeChat Pay, сервер отвечает «支付暂未开通» и кнопка неактивна.
const api = require('../../utils/api');
const { t, pick } = require('../../utils/i18n');
const fmt = require('../../utils/format');

Page({
  data: { ready: false, error: '', lang: 'zh', L: t('zh'), order: null, paying: false },

  onLoad(query) {
    api.captureQuery(query);
    this.orderId = query.o;
  },

  onShow() { this.load(); },

  load() {
    const lang = api.lang();
    this.setData({ lang, L: t(lang) });
    if (!this.orderId) return this.setData({ ready: true, error: t(lang).loadError });
    return api.get(`/api/wx/orders/${this.orderId}`)
      .then((o) => this.setData({
        ready: true,
        error: '',
        order: { description: pick(o.description, lang), amount: fmt.yuan(o.totalFen), status: o.status, paid: o.status === 'paid', payEnabled: o.payEnabled },
      }))
      .catch((err) => this.setData({ ready: true, error: api.errorText(err, lang) }));
  },

  pay() {
    if (this.data.paying) return;
    const L = this.data.L;
    this.setData({ paying: true });
    api.post(`/api/wx/orders/${this.orderId}/pay`)
      .then((r) => new Promise((resolve, reject) => {
        wx.requestPayment(Object.assign({}, r.payment, { success: resolve, fail: reject }));
      }))
      .then(() => {
        wx.showToast({ title: L.paid });
        // Сервер узнаёт об оплате из уведомления WeChat Pay — перечитываем заказ чуть позже.
        setTimeout(() => this.load(), 1500);
      })
      .catch((err) => wx.showToast({ title: (err && err.errMsg) ? L.payFail : api.errorText(err, this.data.lang), icon: 'none' }))
      .then(() => this.setData({ paying: false }));
  },
});
