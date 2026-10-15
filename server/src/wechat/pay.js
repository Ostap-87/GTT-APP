// WeChat Pay API v3, оплата внутри мини-программы (JSAPI).
// Подпись запросов — закрытым ключом торгового счёта (RSA-SHA256), проверка уведомлений —
// открытым ключом WeChat Pay («微信支付公钥»), расшифровка — APIv3-ключом (AES-256-GCM).
import { createSign, createVerify, createDecipheriv, randomBytes } from 'node:crypto';

const HOST = 'https://api.mch.weixin.qq.com';

export const nonce = () => randomBytes(16).toString('hex');
export const unixTime = (now = Date.now()) => String(Math.floor(now / 1000));

export function rsaSign(privateKeyPem, message) {
  return createSign('RSA-SHA256').update(message).sign(privateKeyPem, 'base64');
}

export function rsaVerify(publicKeyPem, message, signature) {
  try {
    return createVerify('RSA-SHA256').update(message).verify(publicKeyPem, signature, 'base64');
  } catch {
    return false;
  }
}

// Заголовок Authorization для запроса к API v3.
export function authorization({ mchId, serialNo, privateKeyPem }, method, urlPath, body = '', ts = unixTime(), nonceStr = nonce()) {
  const message = `${method}\n${urlPath}\n${ts}\n${nonceStr}\n${body}\n`;
  const signature = rsaSign(privateKeyPem, message);
  return `WECHATPAY2-SHA256-RSA2048 mchid="${mchId}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${ts}",serial_no="${serialNo}"`;
}

// Параметры для wx.requestPayment на телефоне.
export function paymentParams({ appId, privateKeyPem }, prepayId, ts = unixTime(), nonceStr = nonce()) {
  const pkg = `prepay_id=${prepayId}`;
  const paySign = rsaSign(privateKeyPem, `${appId}\n${ts}\n${nonceStr}\n${pkg}\n`);
  return { timeStamp: ts, nonceStr, package: pkg, signType: 'RSA', paySign };
}

export function decryptResource({ ciphertext, associated_data: aad = '', nonce: iv }, apiV3Key) {
  const raw = Buffer.from(ciphertext, 'base64');
  const tag = raw.subarray(raw.length - 16);
  const data = raw.subarray(0, raw.length - 16);
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(apiV3Key, 'utf8'), Buffer.from(iv, 'utf8'));
  decipher.setAAD(Buffer.from(aad, 'utf8'));
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8'));
}

// Проверка подписи уведомления или ответа WeChat Pay по заголовкам Wechatpay-*.
export function verifySignedBody(pay, headers, rawBody, now = Date.now()) {
  const h = (name) => headers[name.toLowerCase()];
  const ts = h('Wechatpay-Timestamp');
  const nonceStr = h('Wechatpay-Nonce');
  const signature = h('Wechatpay-Signature');
  const serial = h('Wechatpay-Serial');
  if (!ts || !nonceStr || !signature) return false;
  if (Math.abs(now / 1000 - Number(ts)) > 300) return false;
  if (pay.platformPublicKeyId && serial !== pay.platformPublicKeyId) return false;
  return rsaVerify(pay.platformPublicKeyPem, `${ts}\n${nonceStr}\n${rawBody}\n`, signature);
}

export class WeChatPay {
  constructor(pay, appId, fetchImpl = globalThis.fetch) {
    this.pay = pay;
    this.appId = appId;
    this.fetch = fetchImpl;
  }

  async request(method, urlPath, payload) {
    const body = payload ? JSON.stringify(payload) : '';
    const res = await this.fetch(HOST + urlPath, {
      method,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: authorization(this.pay, method, urlPath, body),
      },
      body: payload ? body : undefined,
    });
    const text = await res.text();
    const headers = Object.fromEntries([...res.headers].map(([k, v]) => [k.toLowerCase(), v]));
    if (headers['wechatpay-signature'] && !verifySignedBody(this.pay, headers, text)) {
      throw new Error('WeChat Pay: подпись ответа не сошлась');
    }
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(`WeChat Pay ${res.status}: ${data.code || ''} ${data.message || ''}`);
    return data;
  }

  // Создаёт заказ и возвращает параметры для wx.requestPayment.
  async jsapi({ outTradeNo, description, totalFen, openid }) {
    const { prepay_id: prepayId } = await this.request('POST', '/v3/pay/transactions/jsapi', {
      appid: this.appId,
      mchid: this.pay.mchId,
      description: description.slice(0, 127),
      out_trade_no: outTradeNo,
      notify_url: this.pay.notifyUrl,
      amount: { total: totalFen, currency: 'CNY' },
      payer: { openid },
    });
    return paymentParams({ appId: this.appId, privateKeyPem: this.pay.privateKeyPem }, prepayId);
  }

  // Статус заказа — на случай, если уведомление не дошло.
  async query(outTradeNo) {
    return this.request('GET', `/v3/pay/transactions/out-trade-no/${encodeURIComponent(outTradeNo)}?mchid=${this.pay.mchId}`);
  }

  // Разбор уведомления об оплате. Возвращает расшифрованную транзакцию или null.
  parseNotify(headers, rawBody) {
    if (!verifySignedBody(this.pay, headers, rawBody)) return null;
    const event = JSON.parse(rawBody);
    if (!event.resource) return null;
    return { eventType: event.event_type, transaction: decryptResource(event.resource, this.pay.apiV3Key) };
  }
}
