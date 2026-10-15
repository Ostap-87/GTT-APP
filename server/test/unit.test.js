import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createCipheriv, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { signSession, verifySession, inviteCode } from '../src/auth.js';
import { visitView, guestListRows } from '../src/store.js';
import { xlsx } from '../src/xlsx.js';
import { fitField } from '../src/wechat/client.js';
import { authorization, paymentParams, rsaVerify, rsaSign, WeChatPay, decryptResource } from '../src/wechat/pay.js';
import { wecomMarkdown } from '../src/wecom.js';
import { subscribeFields } from '../src/events.js';

const seed = JSON.parse(readFileSync(fileURLToPath(new URL('../data/demo.json', import.meta.url)), 'utf8'));
const visit = seed.visits[0];

test('сессия: подпись, срок, подделка', () => {
  const t = signSession('s', 'open-1', 1, 1000);
  assert.equal(verifySession('s', t, 2000), 'open-1');
  assert.equal(verifySession('other', t, 2000), null);
  assert.equal(verifySession('s', t, 1000 + 2 * 86400_000), null);
  assert.equal(verifySession('s', `${t}x`, 2000), null);
  assert.match(inviteCode(), /^[A-Za-z2-9]{12}$/);
});

test('принимающая сторона не видит телефонов, почт и паспортов', () => {
  for (const role of ['host', 'colleague']) {
    const text = JSON.stringify(visitView(visit, role));
    assert.ok(!text.includes('+7 900'), `телефон виден роли ${role}`);
    assert.ok(!text.includes('passportNo'), 'паспорт');
    assert.ok(!text.includes('"private":'), 'закрытый блок');
    assert.ok(!text.includes('@example.com') || role === 'host', 'почта только у менеджера визита');
  }
  const host = visitView(visit, 'host');
  const colleague = visitView(visit, 'colleague');
  assert.equal(host.delegates.length, 18);
  assert.deepEqual(host.industries, { retail: 9, manufacturing: 4, investment: 3, other: 2 });
  assert.equal(host.requests.find((r) => r.id === 'r1').contact.email, 'anna.smirnova@example.com');
  assert.equal(host.requests.find((r) => r.id === 'r3').contact, null, 'без согласия контактов нет');
  assert.ok(colleague.requests.every((r) => r.contact === null), 'коллеги контактов не видят');
  assert.equal(colleague.can.guestList, false);
  assert.ok(!JSON.stringify(host.questions).includes('"ru"'), 'исходный русский текст вопросов не уходит');
});

test('xlsx открывается как zip и содержит список гостей', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xlsx-'));
  const file = path.join(dir, 'g.xlsx');
  writeFileSync(file, xlsx(guestListRows(visit), '访客名单'));
  const out = execFileSync('python3', ['-I', '-c', `
import zipfile, sys
z = zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None
s = z.read('xl/worksheets/sheet1.xml').decode()
print(len(z.namelist()), 'Anna Smirnova' in s, '+7' in s)`, file]).toString().trim();
  assert.equal(out, '5 True False');
});

test('поля уведомлений обрезаются по лимитам WeChat', () => {
  assert.equal(fitField('thing1', 'а'.repeat(30)).length, 20);
  assert.equal(fitField('time2', '2026-11-10 10:25'), '2026-11-10 10:25');
  assert.deepEqual(subscribeFields({ fields: { thing1: '{company}', time2: '{eta}' } }, { company: '京东', eta: '10:25' }), { thing1: '京东', time2: '10:25' });
});

test('WeChat Pay: подписи запроса и оплаты, уведомление расшифровывается', () => {
  const merchant = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const platform = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const mPriv = merchant.privateKey.export({ type: 'pkcs8', format: 'pem' });
  const mPub = merchant.publicKey.export({ type: 'spki', format: 'pem' });
  const pPriv = platform.privateKey.export({ type: 'pkcs8', format: 'pem' });
  const pPub = platform.publicKey.export({ type: 'spki', format: 'pem' });

  const header = authorization({ mchId: '1900000001', serialNo: 'SER', privateKeyPem: mPriv }, 'POST', '/v3/pay/transactions/jsapi', '{"a":1}', '1700000000', 'abc');
  const sig = /signature="([^"]+)"/.exec(header)[1];
  assert.ok(rsaVerify(mPub, 'POST\n/v3/pay/transactions/jsapi\n1700000000\nabc\n{"a":1}\n', sig));

  const p = paymentParams({ appId: 'wxapp', privateKeyPem: mPriv }, 'wx123', '1700000000', 'n1');
  assert.equal(p.package, 'prepay_id=wx123');
  assert.ok(rsaVerify(mPub, 'wxapp\n1700000000\nn1\nprepay_id=wx123\n', p.paySign));

  const apiV3Key = randomBytes(16).toString('hex'); // 32 символа
  const iv = 'abcdefghijkl';
  const plain = JSON.stringify({ out_trade_no: 'demo-0001-x', trade_state: 'SUCCESS', transaction_id: 't1', amount: { total: 1 } });
  const c = createCipheriv('aes-256-gcm', Buffer.from(apiV3Key), Buffer.from(iv));
  c.setAAD(Buffer.from('transaction'));
  const ciphertext = Buffer.concat([c.update(plain, 'utf8'), c.final(), c.getAuthTag()]).toString('base64');
  const resource = { algorithm: 'AEAD_AES_256_GCM', ciphertext, associated_data: 'transaction', nonce: iv };
  assert.equal(decryptResource(resource, apiV3Key).transaction_id, 't1');

  const body = JSON.stringify({ id: 'e1', event_type: 'TRANSACTION.SUCCESS', resource });
  const ts = String(Math.floor(Date.now() / 1000));
  const headers = {
    'wechatpay-timestamp': ts, 'wechatpay-nonce': 'nn', 'wechatpay-serial': 'PUB_KEY_ID_1',
    'wechatpay-signature': rsaSign(pPriv, `${ts}\nnn\n${body}\n`),
  };
  const payApi = new WeChatPay({ apiV3Key, platformPublicKeyPem: pPub, platformPublicKeyId: 'PUB_KEY_ID_1' }, 'wxapp');
  assert.equal(payApi.parseNotify(headers, body).transaction.out_trade_no, 'demo-0001-x');
  assert.equal(payApi.parseNotify({ ...headers, 'wechatpay-signature': 'AAAA' }, body), null, 'поддельная подпись');
  assert.equal(payApi.parseNotify({ ...headers, 'wechatpay-serial': 'OTHER' }, body), null, 'чужой ключ');
});

test('WeCom: markdown в пределах лимита', () => {
  const m = wecomMarkdown('Заголовок', ['строка', null, 'x'.repeat(5000)]);
  assert.equal(m.msgtype, 'markdown');
  assert.ok(Buffer.byteLength(m.markdown.content) <= 4096);
  assert.ok(m.markdown.content.startsWith('**Заголовок**\n> строка'));
});
