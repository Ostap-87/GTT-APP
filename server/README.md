# Сервер мини-программы WeChat

Node.js 20+, без внешних зависимостей. Хранит визиты в JSON-файле (`DATA_DIR/state.json`) — для пилота;
потом подключается к общей базе приложения GTT.

```
npm run dev     # WX_MOCK=1: демо-визит JD.com, WeChat не вызывается, порт 8787
npm test        # тесты: доступы, Excel, подписи WeChat Pay, сквозной сценарий API
npm start       # боевой режим, переменные окружения — ниже
```

Проверка мини-программы против этого сервера — из корня репозитория: `node tools/mp-check.mjs`.

## Переменные окружения

Секреты задаются только на сервере (файл окружения systemd, права 600) — не в репозитории и не в чате.

| Переменная | Что это |
| --- | --- |
| `PORT` | порт, по умолчанию 8787 |
| `DATA_DIR` | папка данных: `state.json` и загруженные компаниями файлы |
| `SESSION_SECRET` | случайная строка ≥ 32 символов для подписи сессий |
| `ADMIN_TOKEN` | токен координатора для `/api/admin/*` (заголовок `x-admin-token`) |
| `WX_APPID`, `WX_SECRET` | AppID и AppSecret мини-программы (кабинет → 开发管理 → 开发设置) |
| `WX_ENV_VERSION` | `release` / `trial` / `develop` — какую версию открывают QR-коды и уведомления |
| `WX_TEMPLATES_FILE` | шаблоны уведомлений, по умолчанию `config/subscribe-templates.json` |
| `WECOM_WEBHOOK_KEY` | ключ вебхука бота рабочей группы WeCom (企业微信) |
| `WXPAY_MCHID`, `WXPAY_SERIAL_NO` | номер торгового счёта WeChat Pay и серийный номер сертификата |
| `WXPAY_PRIVATE_KEY_FILE` | закрытый ключ торгового счёта (apiclient_key.pem) |
| `WXPAY_APIV3_KEY` | ключ APIv3 (32 символа) |
| `WXPAY_PUBLIC_KEY_FILE`, `WXPAY_PUBLIC_KEY_ID` | открытый ключ WeChat Pay (微信支付公钥) и его ID `PUB_KEY_ID_…` |
| `WXPAY_NOTIFY_URL` | `https://<домен>/api/wx/pay/notify` |
| `MAX_UPLOAD_MB` | лимит файла от компании, по умолчанию 30 |
| `AMAP_KEY` | ключ Amap типа «Web服务» для «Рядом» (`src/amap/README.md`); без него — демо-режим с вымышленными местами |
| `NEARBY_APP_TOKEN` | токен приложения для `/api/nearby` (заголовок `x-app-token`); то же значение — `EXPO_PUBLIC_NEARBY_TOKEN` |
| `NEARBY_RATE_PER_MIN` | запросов к `/api/nearby` в минуту с одного IP, по умолчанию 30 |
| `MT_PROVIDER`, `MT_KEY`, `MT_FOLDER_ID` | машинный перевод меток Amap (`yandex` или `deepl`), по желанию |

Без `WXPAY_*` оплата выключена (кнопка в мини-программе неактивна). Без `WECOM_WEBHOOK_KEY` сообщения команде
пишутся в лог. Шаблон уведомления с пустым `templateId` не отправляется.

## API

Приложение (без входа; `x-app-token`, если задан `NEARBY_APP_TOKEN`):

| Запрос | Что делает |
| --- | --- |
| `GET /api/nearby?kind=pharmacy\|fruit\|supermarket\|convenience&lat&lng&lang=ru\|en\|kk\|uz` | ближайшие места по Amap, переведённые на язык делегата, с китайским оригиналом (`src/amap/README.md`) |


Мини-программа (заголовок `Authorization: Bearer <токен из /api/wx/login>`):

| Запрос | Кто | Что делает |
| --- | --- | --- |
| `GET /api/wx/config` | все | включена ли оплата, ID шаблонов уведомлений |
| `POST /api/wx/login {code, invite?}` | все | `code` из `wx.login`; `invite` — код из ссылки или QR. Возвращает токен и визиты |
| `GET /api/wx/visits/:id` | участник визита | визит без телефонов, почт и паспортов; контакты из запросов — только менеджеру и с согласия |
| `POST /api/wx/visits/:id/confirm` | менеджер | подтвердить визит |
| `POST /api/wx/visits/:id/propose-time {date, start, note}` | менеджер | предложить другое время |
| `POST /api/wx/visits/:id/materials` (multipart: `file`, `name`) | менеджер | файл компании — на проверку координатору |
| `POST /api/wx/visits/:id/replies {requestId?, text}` | менеджер | ответ делегатам через координатора |
| `POST /api/wx/visits/:id/share` | менеджер | код для коллег (роль «коллега»: только просмотр) |
| `GET /api/wx/visits/:id/guest-list.xlsx` | менеджер | список гостей для охраны |
| `POST /api/wx/subscriptions {accepted:[templateId]}` | все | разрешения на уведомления после `wx.requestSubscribeMessage` |
| `GET /api/wx/orders/:id`, `POST /api/wx/orders/:id/pay` | участник визита | заказ и параметры для `wx.requestPayment` |
| `POST /api/wx/pay/notify` | WeChat Pay | уведомление об оплате (проверка подписи, расшифровка) |

Координатор (заголовок `x-admin-token`):

| Запрос | Что делает |
| --- | --- |
| `PUT /api/admin/visits/:id` | завести или обновить визит; формат — как в `data/demo.json` |
| `POST /api/admin/visits/:id/invites {role}` | код приглашения `host` (менеджер) или `colleague` |
| `GET /api/admin/invites/:code/qr.png` | QR-код мини-программы с этим приглашением |
| `POST /api/admin/invites/:code/revoke` | отозвать приглашение |
| `POST /api/admin/visits/:id/events {type, …}` | `departed {eta}`, `reschedule {date, start, end?}`, `request {title, summary}` — меняет визит и рассылает уведомления |
| `GET /api/admin/visits/:id/inbox` | предложения времени, ответы, файлы, кто вошёл |
| `GET /api/admin/visits/:id/materials/:mid/file` | скачать файл компании |
| `POST /api/admin/visits/:id/materials/:mid/publish` | открыть материал делегатам |
| `PUT /api/admin/orders/:id {visitId, description:{zh,en}, totalFen}` | заказ на оплату; ссылка `/pages/pay/index?o=<id>` |

Пример — группа выехала:

```
curl -X POST https://<домен>/api/admin/visits/jd-1110/events \
  -H "x-admin-token: $ADMIN_TOKEN" -H 'content-type: application/json' \
  -d '{"type":"departed","eta":"10:25"}'
```

## Где запускать

Мини-программа ходит только на HTTPS-домены из списка в кабинете (开发管理 → 服务器域名: request, uploadFile,
downloadFile). Сервер должен быть быстро доступен из Китая — лучше VPS в Гонконге или в Китае. Для домена в
материковом Китае нужна регистрация 备案; гонконгскому серверу она не нужна.

Персональные данные: на этот сервер попадает минимум для визита — имя латиницей, должность, тип компании,
вопросы. Телефоны в запросах компании не уходят; номера паспортов сервер не принимает. Основная база с
данными граждан России остаётся на VPS в России (152-ФЗ). Передачу данных за рубеж и уведомление
Роскомнадзора стоит проверить с юристом до пилота.

Пример службы systemd (`/etc/systemd/system/gtt-mp.service`):

```
[Unit]
Description=GTT WeChat mini program API
After=network.target

[Service]
WorkingDirectory=/opt/gtt-app/server
EnvironmentFile=/etc/gtt-mp.env
ExecStart=/usr/bin/node src/index.js
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

nginx: `location /api/ { proxy_pass http://127.0.0.1:8787; client_max_body_size 32m; }` на HTTPS-домене.
