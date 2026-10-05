# Развёртывание и эксплуатация

URL после запуска — в корневом [README](../README.md#docker-compose).

## Запуск стека

### 1. Проверить окружение

Нужны Docker Compose, Node.js 20+, npm и git:

```bash
docker --version
docker compose version
node --version
npm --version
git --version
```

### 2. Клонировать репозиторий

```bash
git clone https://github.com/SergeyObraztsov11/Maintenance-API.git
cd Maintenance-API
npm install
```

### 3. Создать файл `.env`

Локально:

```bash
cp .env.example .env
```

На сервере (все ключи, случайные секреты через `openssl`):

```bash
cat > .env <<EOF
PORT=3000
NODE_ENV=production
CORS_ORIGINS=http://localhost:5500
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
REQUEST_TIMEOUT_MS=5000
FORECAST_BASE_URL=https://api.open-meteo.com
WEATHER_WIND_MAX_MS=12
WEATHER_PRECIPITATION_MAX_MM=0.1
LOG_LEVEL=info
DB_HOST=localhost
DB_PORT=5433
DB_NAME=maintenance
TEST_DB_NAME=maintenance_test
DB_USER=maintenance
DB_PASSWORD=$(openssl rand -hex 16)
DB_POOL_MIN=0
DB_POOL_MAX=10
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_TTL_SECONDS=604800
REFRESH_COOKIE_NAME=refreshToken
REFRESH_COOKIE_SAMESITE=lax
EOF
```

```bash
cat .env
```

### 4. Поднять стек (два варианта)

Перед этим на **сервере** уже сделаны шаги 1–3 (Docker / Node / git, клон репо, `.env`).  
Клон нужен в обоих вариантах: в образе только API, а `docker-compose.yml` и конфиги из `deploy/` лежат в репозитории.

Результат одинаковый: Nginx `:8080`, Postgres, Prometheus, Grafana. Отличается только место сборки образа API.

#### Вариант A — сборка на сервере

Всё на сервере, в каталоге репозитория:

```bash
cd /var/www/Maintenance-API   # или путь, куда клонировали
npm run docker:up
npm run docker:seed
```

`docker:up` = `docker compose up --build -d` (собирает образ `maintenance-api` и поднимает стек).

Остановка: `npm run docker:down`.

С очисткой томов (БД с нуля):

```bash
docker compose down -v
npm run docker:up
npm run docker:seed
```

#### Вариант B — сборка на ПК (слабый VPS)

Тяжёлый `docker build` на компьютере; на сервер уезжает готовый образ. На сервере **не** вызывайте `npm run docker:up` — он снова начнёт сборку.

**На ПК** (корень репозитория, Docker Desktop; репо уже есть локально):

```bash
cd /path/to/Maintenance-API
npm run docker:build
docker save -o maintenance-api.tar maintenance-api
```

Передать архив (Windows PowerShell, подставьте IP; спросит пароль root):

```powershell
scp maintenance-api.tar root@SERVER_IP:/var/www/Maintenance-API/
```

**На сервере:**

```bash
cd /var/www/Maintenance-API
docker load -i maintenance-api.tar
npm run docker:start
npm run docker:seed
```

`docker:start` = `docker compose up -d` **без** `--build` (берёт образ `maintenance-api` из `docker load`).  
Postgres / Nginx / Prometheus / Grafana при первом запуске скачаются с Docker Hub.

Дальше те же команды, что и в варианте A: `docker:logs`, `docker:down`, `docker compose down -v`.

### 5. Проверить доступ

Локально — URL из README. На сервере вместо `localhost` подставьте IP или домен (`http://203.0.113.10:8080`). Grafana и Prometheus слушают `127.0.0.1`: доступ с сервера или через SSH-туннель.

```bash
docker compose ps
curl -sS http://127.0.0.1:8080/api/health/live
```

## API на хосте

В `.env`: `DB_HOST=localhost`, `DB_PORT=5433`.

```bash
docker compose up -d db prometheus grafana
npm run db:migrate
npm run seed
npm run dev
```

Prometheus скрейпит `host.docker.internal:3000`.

## Переменные и Docker Compose

- `.env` подставляется в `docker-compose.yml` (`${DB_PORT}`, `${DB_NAME}`, …) и передаётся в контейнеры через `env_file`.
- В контейнере `api`: `DB_HOST=db`, `DB_PORT=5432` (переопределение из compose).
- `DB_NAME` / `DB_USER` / `DB_PASSWORD` → `POSTGRES_*` у образа Postgres.
- Логин Grafana (`admin` / `admin`) и внешние порты заданы в `docker-compose.yml`.

## Миграции и сиды

| Действие | Команда |
|----------|---------|
| Применить | `npm run db:migrate` |
| Откатить последнюю | `npm run db:migrate:undo` |
| Откатить все | `npm run db:migrate:undo:all` |
| Сиды | `npm run seed` или `npm run docker:seed` |

В Docker migrate выполняется при старте API (`deploy/docker-entrypoint.sh`). Сиды — только вручную.

## Nginx

Конфиг: [`deploy/nginx/default.conf`](../deploy/nginx/default.conf).

| location | Поведение |
|----------|-----------|
| `/metrics` | **403** (скрейп только внутри Docker-сети на `api:3000`) |
| `/api/docs`, `/api/openapi.json` | proxy → `api:3000` (Swagger) |
| `/api/` | proxy → `api:3000` (API) |
| `/` | **404** JSON |

Заголовки: `Host`, `X-Real-IP`, `X-Forwarded-*`, `X-Request-Id`. Лимит тела 1m, gzip, proxy timeouts. В Express: `trust proxy = 1`.

## Логи и метрики

### Логи

| Режим | Команда / место |
|-------|-----------------|
| API в Docker | `npm run docker:logs` (`docker compose logs -f api`) |
| API на хосте | stdout процесса `npm run dev` / `npm start` |
| Все сервисы compose | `docker compose logs -f` |

В каждой записи API есть `requestId` (также в заголовке ответа и в теле ошибки). По нему связывают лог и конкретный HTTP-запрос.

### Сквозная трассировка `requestId`

```text
Nginx ($request_id → заголовок X-Request-Id)
  → API (middleware requestId)
  → JSON-лог + тело ошибки + заголовок ответа X-Request-Id
  → панель «Сквозная трассировка» на дашборде API Technical Metrics
```

1. Сделать запрос через Nginx, например `curl -si http://localhost:8080/api/health/live`.
2. Скопировать `X-Request-Id` из ответа.
3. Найти тот же id в логах: `npm run docker:logs` или `docker compose logs api`.
4. В Grafana → Maintenance → **API Technical Metrics** внизу панель с описанием цепочки.

`requestId` не добавляется в метки Prometheus (слишком много уникальных значений).

### Метрики

Конфиги: [`deploy/prometheus/`](../deploy/prometheus/), [`deploy/grafana/`](../deploy/grafana/).

| Сервис | Адрес |
|--------|--------|
| Grafana | `http://127.0.0.1:3001` (`admin` / `admin`) |
| Prometheus | `http://127.0.0.1:9090` |
| Postgres на хосте | `127.0.0.1:${DB_PORT}` |
| `/metrics` API | только внутри Docker-сети (`api:3000`), через Nginx — 403 |

Дашборды в Grafana → Maintenance. JSON: `deploy/grafana/dashboards/`.

| Дашборд | Источник | Содержание |
|---------|----------|------------|
| API Technical Metrics | Prometheus | RPS, 4xx/5xx, latency, availability, панель трассировки `requestId` |
| Business Metrics | PostgreSQL | статусы, приоритеты, закрытие, просрочки |

Алерты: `deploy/grafana/provisioning/alerting/rules.yml` (UI: Alerting → Alert rules). SMTP не настроен — смотреть статус **Firing**.

| Алерт | Условие |
|-------|---------|
| API unavailable | `up` < 1 |
| High 5xx error rate | доля 5xx > 5% дольше 2 мин |
| Too many overdue planned requests | > 10 открытых просроченных плановых |

## Runbook

### API unavailable

1. `docker compose ps` — API запущен.
2. `GET /api/health/live` → 200.
3. `/metrics` на `api:3000` (не через Nginx) отдаёт текст.
4. Prometheus → Targets → UP.
5. Если DOWN — сеть/порт, перезапуск API, подождать ~1 мин.

### High 5xx error rate

1. Технический дашборд — path и код ответа.
2. `GET /api/health/ready` — при 503 проверить БД.
3. `docker compose ps db`, переменные `DB_*`.
4. Логи API по `requestId`, при необходимости Postman.

### Too many overdue planned requests

1. Бизнес-дашборд — просрочки.
2. `done`, перенос `plannedAt` или `rejected`.
3. Счётчик ≤ 10 — алерт снимается.

| Симптом | С чего начать |
|---------|----------------|
| БД недоступна | `ready` → 503; `docker compose ps db`; миграции |
| Рост 5xx | техдашборд, логи, недавний деплой |
| Диск | `docker system df` |
| Пустые техграфики | API или Prometheus target DOWN |
| Пустые бизнес-панели | нет seed или datasource Postgres |
