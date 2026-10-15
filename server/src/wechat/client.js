// Обращения к API WeChat: вход (code2session), access_token, подписочные уведомления, QR-код мини-программы.
// В режиме WX_MOCK=1 ничего не уходит наружу — для локальной разработки и тестов.

const API = 'https://api.weixin.qq.com';

export class WeChatError extends Error {
  constructor(where, errcode, errmsg) {
    super(`${where}: ${errcode} ${errmsg}`);
    this.errcode = errcode;
  }
}

// Ограничения длины значений в подписочных уведомлениях (по типу поля).
const LIMITS = { thing: 20, phrase: 5, character_string: 32, name: 10, number: 32, letter: 32, symbol: 5 };
export function fitField(key, value) {
  const type = key.replace(/\d+$/, '');
  const limit = LIMITS[type];
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!limit || [...text].length <= limit) return text;
  return [...text].slice(0, limit - 1).join('') + '…';
}

export class WeChatClient {
  constructor({ appId, secret, envVersion = 'release', mock = false, fetchImpl = globalThis.fetch, log = () => {} }) {
    Object.assign(this, { appId, secret, envVersion, mock, fetch: fetchImpl, log });
    this.token = null;
    this.tokenExp = 0;
  }

  async code2session(code) {
    if (!code) throw new WeChatError('code2session', 'nocode', 'empty code');
    if (this.mock) return { openid: `mock-${code}`, session_key: 'mock' };
    const q = new URLSearchParams({ appid: this.appId, secret: this.secret, js_code: code, grant_type: 'authorization_code' });
    const res = await this.fetch(`${API}/sns/jscode2session?${q}`);
    const data = await res.json();
    if (data.errcode) throw new WeChatError('code2session', data.errcode, data.errmsg);
    return data;
  }

  async accessToken(now = Date.now()) {
    if (this.mock) return 'mock-token';
    if (this.token && now < this.tokenExp) return this.token;
    const res = await this.fetch(`${API}/cgi-bin/stable_token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ grant_type: 'client_credential', appid: this.appId, secret: this.secret }),
    });
    const data = await res.json();
    if (!data.access_token) throw new WeChatError('stable_token', data.errcode, data.errmsg);
    this.token = data.access_token;
    this.tokenExp = now + (data.expires_in - 300) * 1000;
    return this.token;
  }

  miniprogramState() {
    return { develop: 'developer', trial: 'trial', release: 'formal' }[this.envVersion] || 'formal';
  }

  // Одно подписочное уведомление. Возвращает true, если WeChat принял.
  async sendSubscribe({ openid, templateId, page, fields }) {
    const data = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, { value: fitField(k, v) }]));
    const body = { touser: openid, template_id: templateId, page, data, miniprogram_state: this.miniprogramState(), lang: 'zh_CN' };
    if (this.mock) { this.log('subscribe(mock)', body); return true; }
    const token = await this.accessToken();
    const res = await this.fetch(`${API}/cgi-bin/message/subscribe/send?access_token=${token}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    });
    const out = await res.json();
    if (out.errcode && out.errcode !== 0) throw new WeChatError('subscribe/send', out.errcode, out.errmsg);
    return true;
  }

  // QR-код мини-программы (小程序码) с кодом приглашения в scene. Возвращает PNG.
  async inviteQr({ scene, page = 'pages/visit/index', width = 430 }) {
    if (this.mock) return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    const token = await this.accessToken();
    const res = await this.fetch(`${API}/wxa/getwxacodeunlimit?access_token=${token}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ scene, page, width, check_path: false, env_version: this.envVersion }),
    });
    const buf = Buffer.from(await res.arrayBuffer());
    if ((res.headers.get('content-type') || '').includes('json')) {
      const err = JSON.parse(buf.toString('utf8'));
      throw new WeChatError('getwxacodeunlimit', err.errcode, err.errmsg);
    }
    return buf;
  }
}
