// Бот рабочей группы WeCom (企业微信): сообщения команде GTT по вебхуку.
// Ключ вебхука — секрет (WECOM_WEBHOOK_KEY), без него сообщения только пишутся в лог.

export function wecomMarkdown(title, lines) {
  const body = lines.filter(Boolean).map((l) => `> ${l}`).join('\n');
  const text = `**${title}**\n${body}`;
  // Лимит WeCom — 4096 байт на markdown
  let out = text;
  while (Buffer.byteLength(out) > 4000) out = out.slice(0, -50);
  return { msgtype: 'markdown', markdown: { content: out === text ? out : `${out}…` } };
}

export class WeComBot {
  constructor({ webhookKey, fetchImpl = globalThis.fetch, log = () => {} }) {
    Object.assign(this, { webhookKey, fetch: fetchImpl, log });
  }

  async send(title, lines) {
    const payload = wecomMarkdown(title, lines);
    if (!this.webhookKey) { this.log('wecom(off)', payload.markdown.content); return false; }
    const res = await this.fetch(`https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${encodeURIComponent(this.webhookKey)}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
    });
    const out = await res.json();
    if (out.errcode !== 0) { this.log('wecom error', out); return false; }
    return true;
  }
}
