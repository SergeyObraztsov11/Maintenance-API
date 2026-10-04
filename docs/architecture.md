# Архитектура

## Стек

```text
Клиент (Postman / Swagger / фронт)
    → Nginx (:8080)          # reverse proxy, gzip, лимит тела; /metrics снаружи закрыт
        → API Node (:3000)   # Express, JWT, бизнес-логика
            → PostgreSQL
Prometheus ← /metrics (внутренняя Docker-сеть)
Grafana ← Prometheus + PostgreSQL
```

Снаружи только Nginx. Grafana и Prometheus слушают `127.0.0.1`.

## Слои

```text
routes → controllers → services → repositories → models / DB
```

| Слой | Ответственность |
|------|-----------------|
| routes | путь, middleware (auth, роли, validate) |
| controllers | HTTP: status, JSON, `next(error)` |
| services | бизнес-правила (статусы, бригада, права техника) |
| repositories | Sequelize / SQL |
| middlewares | requestId, логи, rate limit, errorHandler |

Погода: `weatherService` → `weather/getWeatherByCoordinates` (Open-Meteo).

## Auth

- Access JWT: `Authorization: Bearer …`, короткий TTL
- Refresh: httpOnly cookie (`SameSite=lax`, `Secure` в `production`)
- Роли: `viewer` / `technician` / `admin` — см. README
- За Nginx: `trust proxy` (реальный IP для rate limit и логов)

`SameSite=lax` — для API, Postman и Swagger на одном хосте. Кросс-доменный фронт: `none` + `Secure` и отдельная CSRF-стратегия.

## Формат ошибок

```json
{
  "error": {
    "code": "SOME_CODE",
    "message": "Human-readable message",
    "details": {},
    "requestId": "…"
  }
}
```

## Решения

- Схема БД — только миграции Sequelize (без `sync({ force: true })`)
- В Docker migrate при старте API (`deploy/docker-entrypoint.sh`); сиды отдельно
- Метрики Prometheus; дашборды и алерты Grafana через provisioning

## Ограничения

- HTTPS в Compose не настроен
- Погода зависит от Open-Meteo (в unit-тестах мокается)
- Алерты Grafana без SMTP — статус **Firing** в UI
- Postgres проброшен на `127.0.0.1`
- CI в репозитории нет (бонус кейса)
