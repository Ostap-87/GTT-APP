# Приложение Global Tech Tour (Expo)

Шаг 1 из [`docs/architecture.md`](../docs/architecture.md): экраны делегата на тестовой поездке «Новый ритейл Китая»
(9–14 ноября, участники вымышленные) и открытый каталог 76 программ с сайта. Одно приложение для iPhone, Android
и веб-версии: React Native + Expo SDK 57, навигация — Expo Router (`src/app/`).

## Как открыть на телефоне

1. Один раз: аккаунт на [expo.dev](https://expo.dev/signup) → Settings → Access tokens → Create token;
   в GitHub: Settings → Secrets and variables → Actions → New repository secret `EXPO_TOKEN`.
2. Каждый пуш в `mobile/` публикует обновление (Actions → «Приложение — Expo Go»), в сводке прогона — QR-код.
3. На телефоне: Expo Go из App Store или Google Play, вход тем же аккаунтом Expo, QR-код камерой.

Expo Go открывает только проекты своей версии SDK. Сообщение «Project is incompatible with this version of Expo Go»
значит, что проект новее Expo Go в магазине: SDK проекта держим равным версии Expo Go в App Store (сейчас 57;
проверка — `curl -s 'https://itunes.apple.com/lookup?id=982107779&country=ru'`, поле `version`).

## Команды (из папки `mobile/`)

| Команда | Что делает |
| --- | --- |
| `npm install` | зависимости |
| `npx expo install <пакет>` | добавить пакет — только так, версия подбирается под SDK |
| `npm run typecheck` | проверка типов |
| `npm run export:web` | веб-сборка в `dist/` (проверка, что всё собирается) |
| `npm run sync-catalog` | обновить каталог из клона `Ostap-87/SINOTECH` (по умолчанию `../../sinotech`) |
| `npx expo start` | разработка: QR для Expo Go в той же сети |

Перед пушем: `npm run typecheck` и `npm run export:web` — то же проверяет GitHub Actions «Проверки».

## Что где

- `src/app/` — экраны (каждый файл — маршрут): `index` — вход, `trip/` — вкладки делегата
  (Сегодня, План, Материалы, Люди, Поездка), `catalog/` — программы, `hotel/`, `meal/`, `culture/` — карточки,
  `contacts`, `driver` («Показать водителю»).
- `src/data/catalog.json` — каталог (пишет `tools/sync-catalog.mjs`, цен нет); `trip-base.ts` и `trip.ts` — тестовая
  поездка из прототипа; на шаге 2 их заменит сервер.
- `src/ui/` — тема (`theme.ts`: синий `#1a73e8`, Inter, Sofia Sans Extra Condensed), иконки как в прототипе, общие элементы.
- `src/state/` — состояние делегата в памяти (шаг 1) и всплывающие сообщения.

Expo меняется от версии к версии: перед работой с API смотрите документацию своей версии
(`https://docs.expo.dev/versions/v57.0.0/`, указатель — `https://docs.expo.dev/llms.txt`), а не память.
