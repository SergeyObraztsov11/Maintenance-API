# Maintenance API

REST API на Express: оборудование и заявки на ТО. PostgreSQL (Sequelize, миграции), JWT (access + refresh cookie).  
Docker Compose: Nginx, Prometheus, Grafana.

## Оглавление

- [Схема стека](#схема-стека)
- [Требования](#требования)
- [Установка](#установка)
- [Запуск](#запуск)
- [Роли](#роли)
- [Безопасность](#безопасность)
- [Структура проекта](#структура-проекта)
- [API-документация](#api-документация)
- [Тесты](#тесты)
- [CI](#ci)
- [Документация](#документация)
- [Скрипты и команды](#скрипты-и-команды)
- [Демо-логины](#демо-логины-после-seed)

## Схема стека

```text
Клиент (Postman / Swagger / фронт)
    → Nginx (:8080)
        → API Node (:3000)
            → PostgreSQL
Prometheus ← /metrics (внутренняя сеть)
Grafana ← Prometheus + PostgreSQL
```

Снаружи — Nginx. Grafana и Prometheus: `127.0.0.1`. Подробнее: [`docs/architecture.md`](docs/architecture.md).

## Требования

- Node.js 20+
- npm
- Docker (Postgres; полный стек — Nginx, Prometheus, Grafana)
- Postman — по желанию (`docs/postman/`)

## Установка

```bash
git clone https://github.com/SergeyObraztsov11/Maintenance-API.git
cd Maintenance-API
npm install
cp .env.example .env
```

На сервере задайте свои `JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET` (см. [`docs/deployment.md`](docs/deployment.md)).

### Переменные окружения

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `PORT` | `3000` | Порт API |
| `NODE_ENV` | `development` | В `production` скрывает внутренности ошибок |
| `CORS_ORIGINS` | `http://localhost:5500` | Origin через запятую |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | localhost / 5433 / … | PostgreSQL |
| `TEST_DB_NAME` | `maintenance_test` | БД для Jest |
| `JWT_ACCESS_SECRET` | (из `.env.example`) | Секрет access JWT |
| `JWT_ACCESS_TTL_SECONDS` | `900` | TTL access (~15 мин) |
| `JWT_REFRESH_SECRET` | (из `.env.example`) | Секрет refresh JWT |
| `JWT_REFRESH_TTL_SECONDS` | `604800` | TTL refresh (~7 дней) |
| `REFRESH_COOKIE_NAME` | `refreshToken` | Имя cookie |
| `REFRESH_COOKIE_SAMESITE` | `lax` | SameSite cookie |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | `60000` / `100` | Лимит `/api` |
| `LOG_LEVEL` | `info` | `silent` / `error` / `warn` / `info` / `debug` |
| `FORECAST_BASE_URL` | Open-Meteo | Погодный провайдер |
| `WEATHER_WIND_MAX_MS` / `WEATHER_PRECIPITATION_MAX_MM` | `12` / `0.1` | Пороги «можно работать на улице» |

Полный список — [`.env.example`](.env.example).

## Запуск

### Docker Compose

```bash
cp .env.example .env     # настройки
npm run docker:up        # весь стек
npm run docker:seed      # демо-данные в контейнере api
```

| Сервис | URL |
|--------|-----|
| API (Nginx) | http://localhost:8080 |
| Health live | http://localhost:8080/api/health/live |
| Health ready | http://localhost:8080/api/health/ready |
| Swagger UI | http://localhost:8080/api/docs |
| OpenAPI JSON | http://localhost:8080/api/openapi.json |
| Grafana | http://127.0.0.1:3001 (`admin` / `admin`) |
| Prometheus | http://127.0.0.1:9090 |

Остановка: `npm run docker:down`.  
Деплой и мониторинг: [`docs/deployment.md`](docs/deployment.md).

### API на хосте

```bash
docker compose up -d db   # только Postgres в Docker
npm run db:migrate        # миграции в БД из .env
npm run seed              # демо-данные
npm run dev               # API на хосте с --watch
```

API: http://localhost:3000 · Swagger: http://localhost:3000/api/docs

## Роли

| Роль | Права |
|------|--------|
| `viewer` | Чтение equipment / requests / reports / history. Register → viewer |
| `technician` | Как viewer + создание/правка заявок; статус только у назначенных себе |
| `admin` | Полный доступ |

Без токена → **401**. Недостаточно прав → **403**.  
Контракт API — в Swagger, здесь не дублируется.

## Безопасность

- Access JWT: `Authorization: Bearer …`, короткий TTL
- Refresh: httpOnly cookie (`path=/api/auth`), `Secure` в `production`
- `SameSite=lax` по умолчанию; детали — [`docs/architecture.md`](docs/architecture.md)
- Отдельный rate limit на login; одинаковый текст ошибки при неверном логине/пароле
- За Nginx: `trust proxy`
- Секреты только в `.env`

## Структура проекта

```text
src/
  app.js / server.js
  config/ db/ migrations/ models/
  routes/ controllers/ services/ repositories/
  middlewares/ validators/ errors/
  docs/openapi.yaml
  weather/
deploy/                 # nginx, prometheus, grafana, entrypoint
tests/                  # Jest unit + integration
docs/                   # architecture, deployment, database, testing, postman
```

Слои: `routes → controllers → services → repositories`. Подробнее: [`docs/architecture.md`](docs/architecture.md).

## API-документация

Контракт API — OpenAPI / Swagger UI (методы, тела, ошибки). В README не дублируется.

| Что | URL (через Nginx) | URL (API на хосте) |
|-----|-------------------|--------------------|
| Swagger UI | http://localhost:8080/api/docs | http://localhost:3000/api/docs |
| OpenAPI JSON | http://localhost:8080/api/openapi.json | http://localhost:3000/api/openapi.json |

Спека в репо: [`src/docs/openapi.yaml`](src/docs/openapi.yaml).

## Тесты

```bash
docker compose up -d db   # поднять только Postgres (сервис db)
npm test                  # Jest: создаст maintenance_test при необходимости, migrate, прогон
npm run test:coverage     # то же + отчёт coverage/
```

Подробнее: [`docs/testing.md`](docs/testing.md).

## CI

На каждый push в `main` и на каждый Pull Request GitHub Actions запускает:

1. `npm run check` — ESLint + Prettier  
2. `npm test` — Jest с Postgres (service container)  
3. `docker build` — сборка образа API  

Workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml).  
Статус смотри во вкладке **Actions** репозитория или в checks у PR.

## Документация

| Документ | Содержание |
|----------|------------|
| [`docs/architecture.md`](docs/architecture.md) | Стек, слои, auth, ограничения |
| [`docs/deployment.md`](docs/deployment.md) | Деплой, Nginx, мониторинг, runbook |
| [`docs/database.md`](docs/database.md) | Таблицы, связи, ER-диаграмма |
| [`docs/testing.md`](docs/testing.md) | Тесты |
| [`docs/postman/`](docs/postman/) | Postman |

Конфиги стека: [`deploy/`](deploy/).

## Скрипты и команды

### API

| Команда | Что делает |
|---------|------------|
| `npm run dev` | Запуск API на хосте с автоперезапуском (`node --watch`) |
| `npm start` | Запуск API на хосте без watch |
| `npm run seed` | Загрузка демо-данных в БД из `.env` (процесс на хосте) |

### Docker

| Команда | Что делает |
|---------|------------|
| `docker compose up -d db` | Поднять только Postgres |
| `npm run docker:up` | Собрать образ API и поднять весь стек (db, api, nginx, prometheus, grafana) |
| `npm run docker:down` | Остановить и убрать контейнеры стека (тома остаются) |
| `docker compose down -v` | То же + удалить тома (БД с нуля) |
| `npm run docker:seed` | Сиды внутри контейнера `api` |
| `npm run docker:logs` | Логи контейнера `api` в follow-режиме |
| `npm run docker:build` | Собрать образ `maintenance-api` без compose |

### База данных

| Команда | Что делает |
|---------|------------|
| `npm run db:migrate` | Применить миграции (БД из `.env`) |
| `npm run db:migrate:undo` | Откатить последнюю миграцию |
| `npm run db:migrate:undo:all` | Откатить все миграции |
| `npm run test:db:migrate` | Миграции в тестовую БД (`--env test`) |
| `npm run db:show-tables` | Список таблиц в Postgres через `psql` в контейнере `db` |

### Тесты и качество кода

| Команда | Что делает |
|---------|------------|
| `npm test` | Прогон Jest (ESM) |
| `npm run test:coverage` | Jest с coverage |
| `npm run lint:check` / `lint:fix` | ESLint: проверка / автоисправление |
| `npm run format:check` / `format:fix` | Prettier: проверка / запись |
| `npm run check` | lint + format check |
| `npm run fix` | lint fix + format write |

## Демо-логины (после seed)

Пароль: `password123`  
`admin@example.com` · `tech1@example.com` · `viewer@example.com`
