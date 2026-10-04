# Тестирование

Jest (ESM), отдельная БД PostgreSQL `maintenance_test` (`TEST_DB_NAME`).

## Запуск

```bash
docker compose up -d db   # только Postgres из compose
npm test                  # Jest
npm run test:coverage     # Jest + coverage/
```

В CI (GitHub Actions) отдельные jobs: ESLint, Prettier, Jest (Postgres service), Docker build. См. `.github/workflows/ci.yml`.

Перед прогоном `globalSetup`: создаёт `maintenance_test` (если нет) и применяет миграции (`--env test`).  
Между тестами: `TRUNCATE … CASCADE` (`tests/helpers/db.js`).  
`maxWorkers: 1` — одна общая БД.

## Структура

```text
tests/
  globalSetup.js          # БД + migrate
  setupEnv.js             # NODE_ENV=test, секреты, ослабленный rate limit
  helpers/                # factories, db, sequelizeCli, testDb
  unit/                   # без HTTP
  integration/            # HTTP + реальная БД
  zz-close-db.test.js     # закрытие пула Sequelize
```

Файлы нумеруются (`00-…`, `01-…`). `zz-close-db` — последний (`forceExit` в Jest из‑за handles на Windows).

| Папка | Покрытие |
|-------|----------|
| `unit/` | `allowedRoles`, статусы заявки, assignees, weatherService, Open-Meteo client |
| `integration/` | миграции, health, auth, RBAC, equipment CRUD, reports, validation / delete |

## Helpers

| Файл | Назначение |
|------|------------|
| `factories.js` | пользователи, техники, площадки, оборудование, заявки |
| `db.js` | `connectTestDb` / `resetDb` / `closeTestDb` |
| `testDb.js` | имя БД, `pg` для `CREATE DATABASE` |
| `sequelizeCli.js` | sequelize-cli из Node (без `npx`) |

## Моки

- Open-Meteo: `global.fetch` в unit-тесте клиента
- Unit сервисов: `jest.unstable_mockModule` для репозиториев / моделей
- Integration — реальная БД; внешняя погода в сценариях без неё не вызывается

## Покрытие

`src/**/*.js`, кроме миграций, скриптов и `src/docs`. Отчёт: `coverage/` (`text`, `lcov`).

Не покрывается: e2e через Nginx, Grafana/Prometheus, SMTP, фронт.

## Добавить тест

1. Unit: `tests/unit/NN-name.test.js` (моки до импорта модуля).
2. Integration: `tests/integration/NN-name.test.js` — `connectTestDb` + `resetDb` в `beforeEach`, данные через `factories`.
3. Следующий свободный номер в имени файла.
