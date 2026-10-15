// Адрес сервера мини-программы (server/). Домен должен быть в списках request / uploadFile / downloadFile
// в кабинете mp.weixin.qq.com → 开发管理 → 服务器域名. При загрузке через tools/mp-ci.mjs сюда
// подставляется MP_API_BASE; значение ниже — для WeChat DevTools с локальным сервером (npm run dev).
module.exports = {
  API_BASE: 'http://127.0.0.1:8787',
};
