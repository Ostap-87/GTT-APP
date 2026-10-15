// Что и кому отправлять: подписочные уведомления — принимающей стороне, бот WeCom — команде GTT.

const fill = (tpl, vars) => String(tpl).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

export function subscribeFields(template, vars) {
  return Object.fromEntries(Object.entries(template.fields || {}).map(([key, tpl]) => [key, fill(tpl, vars)]));
}

// Уведомление всем участникам визита, у кого осталось разрешение на этот шаблон.
export async function notifyVisitMembers({ store, wx, templates, log }, visit, event, vars) {
  const template = templates[event];
  if (!template?.templateId) return { sent: 0, skipped: 0, reason: 'шаблон не настроен' };
  let sent = 0;
  let skipped = 0;
  const query = `v=${visit.id}`;
  const page = template.page ? `${template.page}?${query}` : undefined;
  for (const m of store.membersOf(visit.id)) {
    if (!store.take(m.openid, template.templateId)) { skipped += 1; continue; }
    try {
      await wx.sendSubscribe({ openid: m.openid, templateId: template.templateId, page, fields: subscribeFields(template, vars) });
      sent += 1;
    } catch (err) {
      log('subscribe failed', m.openid, err.message);
      if (err.errcode === 43101) store.state.subscriptions[m.openid][template.templateId] = 0;
      skipped += 1;
    }
  }
  store.save();
  return { sent, skipped };
}

const when = (v) => `${v.date} ${v.start}`;

// Сообщения команде в WeCom — по-русски, коротко.
export const teamMessages = {
  confirmed: (v) => [`${v.company.en}: визит подтверждён`, [`Когда: ${when(v)}`]],
  proposed: (v, p) => [`${v.company.en} просит перенести визит`, [`Было: ${when(v)}`, `Предлагают: ${p.date} ${p.start}`, p.note && `Комментарий: ${p.note}`]],
  uploaded: (v, m) => [`${v.company.en} загрузила материал`, [`Файл: ${m.name} (${m.sizeMb} МБ)`, 'Проверьте и откройте делегатам']],
  replied: (v, r, req) => [`${v.company.en} ответила`, [req && `На запрос: ${req.en}`, `Текст: ${r.text}`]],
  joined: (v, m) => [`${v.company.en}: новый вход в мини-программу`, [`Роль: ${m.role === 'host' ? 'менеджер визита' : 'коллега по ссылке'}`]],
  paid: (o, t) => [`Оплата получена: ${o.description.zh}`, [`Сумма: ${(t.amount?.total ?? o.totalFen) / 100} CNY`, `Заказ: ${o.outTradeNo}`]],
};
