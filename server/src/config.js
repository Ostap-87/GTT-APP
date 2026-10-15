// Настройки сервера — только из переменных окружения (секреты в репозиторий не кладём).
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

function readMaybe(path) {
  return path && existsSync(path) ? readFileSync(path, 'utf8') : undefined;
}

export function loadConfig(env = process.env) {
  const mock = env.WX_MOCK === '1';
  const cfg = {
    port: Number(env.PORT || 8787),
    mock,
    dataDir: env.DATA_DIR || here('../data/runtime/'),
    // Демо-визит JD.com — только в режиме разработки; боевой сервер стартует пустым
    seedFile: env.SEED_FILE || here(mock ? '../data/demo.json' : '../data/empty.json'),
    sessionSecret: env.SESSION_SECRET || (mock ? 'dev-only-secret' : ''),
    sessionTtlDays: Number(env.SESSION_TTL_DAYS || 30),
    adminToken: env.ADMIN_TOKEN || (mock ? 'dev-admin' : ''),
    maxUploadMb: Number(env.MAX_UPLOAD_MB || 30),
    wx: {
      appId: env.WX_APPID || (mock ? 'wx-mock-appid' : ''),
      secret: env.WX_SECRET || '',
      // develop | trial | release — какая версия мини-программы открывается из QR и уведомлений
      envVersion: env.WX_ENV_VERSION || 'release',
    },
    templates: JSON.parse(readMaybe(env.WX_TEMPLATES_FILE || here('../config/subscribe-templates.json')) || '{}'),
    wecom: { webhookKey: env.WECOM_WEBHOOK_KEY || '' },
    pay: {
      mchId: env.WXPAY_MCHID || '',
      serialNo: env.WXPAY_SERIAL_NO || '',
      privateKeyPem: env.WXPAY_PRIVATE_KEY || readMaybe(env.WXPAY_PRIVATE_KEY_FILE),
      apiV3Key: env.WXPAY_APIV3_KEY || '',
      platformPublicKeyPem: env.WXPAY_PUBLIC_KEY || readMaybe(env.WXPAY_PUBLIC_KEY_FILE),
      platformPublicKeyId: env.WXPAY_PUBLIC_KEY_ID || '',
      notifyUrl: env.WXPAY_NOTIFY_URL || '',
    },
  };
  cfg.pay.enabled = Boolean(cfg.pay.mchId && cfg.pay.serialNo && cfg.pay.privateKeyPem && cfg.pay.apiV3Key
    && cfg.pay.platformPublicKeyPem && cfg.pay.notifyUrl && cfg.wx.appId);
  return cfg;
}

export function checkConfig(cfg) {
  const missing = [];
  if (!cfg.sessionSecret) missing.push('SESSION_SECRET');
  if (!cfg.adminToken) missing.push('ADMIN_TOKEN');
  if (!cfg.mock) {
    if (!cfg.wx.appId) missing.push('WX_APPID');
    if (!cfg.wx.secret) missing.push('WX_SECRET');
  }
  return missing;
}
