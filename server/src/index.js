// Запуск: npm start (боевые переменные окружения) или npm run dev (WX_MOCK=1, без обращений к WeChat).
import { createServer } from 'node:http';
import { loadConfig, checkConfig } from './config.js';
import { Store } from './store.js';
import { WeChatClient } from './wechat/client.js';
import { WeChatPay } from './wechat/pay.js';
import { WeComBot } from './wecom.js';
import { createApp } from './app.js';

const cfg = loadConfig();
const missing = checkConfig(cfg);
if (missing.length) {
  console.error(`Не заданы переменные окружения: ${missing.join(', ')}`);
  process.exit(1);
}

const log = (...args) => console.log(new Date().toISOString(), ...args);
const store = new Store(cfg);
const wx = new WeChatClient({ ...cfg.wx, mock: cfg.mock, log });
const pay = cfg.pay.enabled ? new WeChatPay(cfg.pay, cfg.wx.appId) : null;
const bot = new WeComBot({ webhookKey: cfg.wecom.webhookKey, log });

createServer(createApp({ cfg, store, wx, pay, bot, log })).listen(cfg.port, () => {
  log(`GTT mini program API on :${cfg.port}${cfg.mock ? ' (WX_MOCK)' : ''}; оплата ${cfg.pay.enabled ? 'включена' : 'выключена'}`);
});
