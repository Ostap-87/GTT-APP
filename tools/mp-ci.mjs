// Загрузка мини-программы в WeChat через miniprogram-ci — без WeChat DevTools.
//   preview — собирает и присылает QR-код предпросмотра (PNG), его сканируют своим WeChat;
//   upload  — загружает версию; потом в кабинете mp.weixin.qq.com её отправляют на модерацию и публикуют.
//
// Переменные окружения (секреты — только в секретах GitHub или сервера):
//   MP_APPID            AppID мини-программы (wx…)
//   MP_UPLOAD_KEY       содержимое ключа загрузки (代码上传密钥) или MP_UPLOAD_KEY_FILE — путь к нему
//   MP_API_BASE         адрес сервера, например https://mp.example.com (попадает в config.js сборки)
//
// Примеры:
//   node tools/mp-ci.mjs preview --query i=demoJDhost01 --out preview.png
//   node tools/mp-ci.mjs upload --version 0.1.0 --desc "Страница визита"
// Нужен пакет: npm i --prefix tools (ставит miniprogram-ci из tools/package.json).
import { cpSync, mkdtempSync, writeFileSync, readFileSync, rmSync, chmodSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const require = createRequire(path.join(root, 'tools/package.json'));

const [action, ...rest] = process.argv.slice(2);
const args = {};
for (let i = 0; i < rest.length; i += 2) args[rest[i].replace(/^--/, '')] = rest[i + 1];

if (!['preview', 'upload'].includes(action)) {
  console.error('Использование: node tools/mp-ci.mjs preview|upload [--version 0.1.0] [--desc текст] [--page pages/visit/index] [--query i=КОД] [--out qr.png] [--robot 1]');
  process.exit(2);
}
const appid = process.env.MP_APPID;
const apiBase = process.env.MP_API_BASE;
const keyText = process.env.MP_UPLOAD_KEY || (process.env.MP_UPLOAD_KEY_FILE && readFileSync(process.env.MP_UPLOAD_KEY_FILE, 'utf8'));
const missing = [!appid && 'MP_APPID', !keyText && 'MP_UPLOAD_KEY', !apiBase && 'MP_API_BASE'].filter(Boolean);
if (missing.length) {
  console.error(`Не заданы: ${missing.join(', ')}`);
  process.exit(2);
}
if (!/^https:\/\//.test(apiBase)) {
  console.error('MP_API_BASE должен начинаться с https:// — WeChat пускает только HTTPS-домены из списка в кабинете');
  process.exit(2);
}
if (action === 'upload' && !/^\d+\.\d+\.\d+$/.test(args.version || '')) {
  console.error('Для upload нужна версия вида 0.1.0: --version 0.1.0');
  process.exit(2);
}

const ci = require('miniprogram-ci');

// Сборка во временной папке: свой config.js с адресом сервера и свой appid.
const work = mkdtempSync(path.join(tmpdir(), 'mp-build-'));
const build = path.join(work, 'miniprogram');
cpSync(path.join(root, 'miniprogram'), build, { recursive: true });
writeFileSync(path.join(build, 'config.js'), `module.exports = { API_BASE: ${JSON.stringify(apiBase.replace(/\/$/, ''))} };\n`);
const projectConfig = JSON.parse(readFileSync(path.join(build, 'project.config.json'), 'utf8'));
projectConfig.appid = appid;
projectConfig.setting.urlCheck = true;
writeFileSync(path.join(build, 'project.config.json'), JSON.stringify(projectConfig, null, 2));
const keyPath = path.join(work, 'upload.key');
writeFileSync(keyPath, keyText);
chmodSync(keyPath, 0o600);

const project = new ci.Project({ appid, type: 'miniProgram', projectPath: build, privateKeyPath: keyPath, ignores: ['node_modules/**/*'] });
const setting = { es6: true, es7: true, enhance: true, minify: true, autoPrefixWXSS: true };
const robot = Number(args.robot || 1);
const desc = args.desc || `GTT ${new Date().toISOString().slice(0, 16)}`;

try {
  if (action === 'preview') {
    const out = path.resolve(args.out || 'mp-preview.png');
    await ci.preview({
      project, desc, setting, robot,
      qrcodeFormat: 'image',
      qrcodeOutputDest: out,
      pagePath: args.page || 'pages/visit/index',
      searchQuery: args.query || '',
      onProgressUpdate: () => {},
    });
    console.log(`QR-код предпросмотра: ${out}`);
  } else {
    const result = await ci.upload({ project, version: args.version, desc, setting, robot, onProgressUpdate: () => {} });
    console.log(`Загружена версия ${args.version}`, JSON.stringify(result.subPackageInfo || {}));
    console.log('Дальше: mp.weixin.qq.com → 版本管理 → 提交审核 (на модерацию) → 发布');
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
