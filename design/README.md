# Дизайн приложения GTT

Макеты экранов по трём ролям. Главная версия — холст Claude Design
[«Приложение GTT: варианты интерфейса»](https://claude.ai/artifact/8Tw2bADzTCNwschFSXRMAy)
(страница «Сценарии по ролям»), здесь — копия его файлов и PNG-превью.

Пример везде один: поездка «Новый ритейл Китая», 9–14 ноября 2026, 18 делегатов, 9 компаний,
визит в JD.com во вторник 10 ноября. Имена делегатов — вымышленные.

## Обзор по ролям

### Делегат — приложение на телефоне, 5 вкладок

![Делегат](previews/_делегат.jpg)

### Координатор — компьютер и телефон, видит и меняет всё

![Координатор](previews/_координатор.jpg)

### Принимающая сторона — ссылка в WeChat, китайский и английский, без установки

![Принимающая сторона](previews/_компания.jpg)

### Мини-программа WeChat — та же страница визита внутри WeChat (код в `miniprogram/`)

![Мини-программа](previews/_мини-программа.jpg)

## Экраны

| Роль | Экран | Файл | Превью |
| --- | --- | --- | --- |
| Делегат | 1 · Моя поездка (до поездки) | [R-D-Trip](canvas/R-D-Trip.dc.html) | [png](previews/R-D-Trip.png) |
| Делегат | 2 · Сегодня | [R-D-Today](canvas/R-D-Today.dc.html) | [png](previews/R-D-Today.png) |
| Делегат | 3 · План (список и сетка по часам) | [R-D-Plan](canvas/R-D-Plan.dc.html) | [png](previews/R-D-Plan.png) |
| Делегат | 4 · Материалы и заметки | [R-D-Library](canvas/R-D-Library.dc.html) | [png](previews/R-D-Library.png) |
| Делегат | 5 · Люди | [R-D-People](canvas/R-D-People.dc.html) | [png](previews/R-D-People.png) |
| Координатор | 1 · Центр поездки (компьютер) | [R-K-Center](canvas/R-K-Center.dc.html) | [png](previews/R-K-Center.png) |
| Координатор | 2 · Визиты компаний (компьютер) | [R-K-Visits](canvas/R-K-Visits.dc.html) | [png](previews/R-K-Visits.png) |
| Координатор | 3 · В поездке (телефон) | [R-K-Phone](canvas/R-K-Phone.dc.html) | [png](previews/R-K-Phone.png) |
| Принимающая сторона | 1 · 概览 Обзор визита | [R-H-Visit](canvas/R-H-Visit.dc.html) | [png](previews/R-H-Visit.png) |
| Принимающая сторона | 2 · 代表团 Кто приедет | [R-H-Delegation](canvas/R-H-Delegation.dc.html) | [png](previews/R-H-Delegation.png) |
| Принимающая сторона | 3 · 问题与资料 Вопросы и материалы | [R-H-Prep](canvas/R-H-Prep.dc.html) | [png](previews/R-H-Prep.png) |
| Принимающая сторона | 4 · 访问后 После визита | [R-H-After](canvas/R-H-After.dc.html) | [png](previews/R-H-After.png) |

Исходные варианты, из которых собраны сценарии (страница холста «Исходные варианты A · B · C»):
`Main`, `A-*` — вариант A «Сегодня + календарь»; `B-*` — вариант B «Дашборд»; `C-*` — вариант C «Лента и люди»;
`Admin-Web`, `Admin-Phone` — первая версия админки. Их превью тоже в `previews/`.

## Как смотреть и обновлять

- **Открыть экран живым:** любой `canvas/*.dc.html` в браузере (нужен интернет для шрифтов Google). Вкладки внизу
  и кнопки «Смотреть как» переходят между экранами. Разметку понимает `canvas/support.js` — маленький
  просмотрщик формата холста: `{{…}}`, `<sc-for>`, `<sc-if>`, `onClick`.
- **Раскладка холста** (позиции, размеры, названия, страницы) — `canvas/canvas.json`.
- **После правок на холсте:** скопировать изменённые `*.dc.html` в `canvas/`, затем
  ```
  node tools/render-previews.mjs        # все PNG; можно указать часть имени: R-H-After
  python3 tools/role-sheets.py          # листы-обзоры previews/_делегат.jpg и др.
  ```
  `render-previews.mjs` берёт `playwright-core` и Chromium (в облаке Claude — `/opt/pw-browsers`).
- Цвета и шрифты — как у сайта и презентаций GTT: синий `#1a73e8`, тёмный `#0f1b2d`, Inter, Sofia Sans Extra
  Condensed для крупных заголовков, Noto Sans SC для китайского.
