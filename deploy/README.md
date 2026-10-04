# Мониторинг

Локальный стек наблюдаемости для Maintenance API: **Prometheus** собирает `/metrics`, **Grafana** показывает дашборды и проверяет алерты.

## Запуск

Из корня проекта:

```bash
# Инфраструктура
docker compose up -d db prometheus grafana

# API на хосте (Prometheus ходит на host.docker.internal:3000)
npm run db:migrate
npm run seed
npm run dev
```

| Сервис | URL | Назначение |
|--------|-----|------------|
| API | http://localhost:3000 | Node-приложение на хосте |
| Метрики | http://localhost:3000/metrics | Текст в формате Prometheus |
| Health live | http://localhost:3000/api/health/live | Процесс жив |
| Health ready | http://localhost:3000/api/health/ready | БД доступна |
| Prometheus | http://localhost:9090 | Status → Targets |
| Grafana | http://localhost:3001 | Логин: `admin` / `admin` |

Источники данных и дашборды подключаются автоматически.

## Дашборды

Папка в Grafana: **Maintenance**

| Дашборд | Источник | Что показывает |
|---------|----------|----------------|
| API Technical Metrics | Prometheus | см. панели ниже |
| Business Metrics | PostgreSQL | Заявки по статусам и приоритетам, среднее время закрытия, просрочки, нагрузка на оборудование |

### API Technical Metrics — панели

| Панель | Смысл |
|--------|--------|
| Интенсивность запросов (RPS) | Нагрузка в реальном времени |
| Доля ошибок (4xx / 5xx) | Какая часть ответов — ошибки клиента/сервера |
| Время ответа (p95 / p50) | Задержки |
| Доступность сервиса | Видит ли Prometheus API (`up`) |
| Успешные и ошибочные запросы (по маршрутам) | По каждому path: сколько 2xx и сколько 4xx/5xx |
| Ошибки по маршрутам (разбивка по кодам) | Stacked-бары: на маршруте какие коды (`401`, `403`, `404`, `500`…) |
| Список ошибок (маршрут → код) | Компактная таблица только ошибочных пар без «пустой» матрицы |

Описания дашбордов: `deploy/grafana/dashboards/`.

## Алерты

Правила: `deploy/grafana/provisioning/alerting/rules.yml`.  
В интерфейсе: Grafana → **Alerting → Alert rules**.

| Алерт | Когда срабатывает |
|-------|-------------------|
| API unavailable | Prometheus не видит живой API (`up` < 1) |
| High 5xx error rate | Доля ответов 5xx выше 5% дольше 2 минут |
| Too many overdue planned requests | Больше 10 открытых просроченных плановых заявок |

Локально почта (SMTP) не настроена — это ожидаемо. Сигнал смотри по статусу **Firing** в UI.

---

## Порядок действий при срабатывании

### API unavailable

1. Проверь, что API запущен: `npm run dev` или контейнер `api`.
2. Открой http://localhost:3000/api/health/live — ожидается `200`.
3. Открой http://localhost:3000/metrics — должен быть текст метрик.
4. В Prometheus → **Status → Targets**: цель `maintenance-api-host` (или `maintenance-api`) в статусе **UP**.
5. Если цель **DOWN**: проверь порт `3000` и сеть, перезапусти API, подожди около минуты — алерт должен вернуться в Normal.

### High 5xx error rate

1. Grafana → **API Technical Metrics** → «Доля ошибок (4xx / 5xx)» и «Ошибки по маршрутам (разбивка по кодам)» — какой path и какой код растут.
2. Уточни детали в таблице «Список ошибок (маршрут → код)».
3. Проверь http://localhost:3000/api/health/ready — при `503` сначала смотри БД.
4. Убедись, что Postgres жив: `docker compose ps db` (healthy), переменные `DB_*` в `.env` верные.
5. Посмотри логи API (JSON в stdout): `statusCode` ≥ 500 и `requestId`; воспроизведи запрос в Postman; после исправления дождись, пока доля 5xx упадёт ниже 5%.

### Too many overdue planned requests

1. Grafana → **Business Metrics** → «Просроченные плановые заявки».
2. Найди открытые заявки с `planned_at` в прошлом (Postman / SQL / админ-сценарий).
3. Закрой выполненную работу (`done`) или перенеси `planned_at` у ещё актуальных заявок.
4. Отмени лишнее статусом `rejected`, если это уместно.
5. Когда счётчик ≤ 10, после следующих проверок алерт выйдет из Firing.

### Типовые отказы

| Симптом | Что проверить в первую очередь |
|---------|--------------------------------|
| БД недоступна | `health/ready` → 503; `docker compose ps db`; миграции |
| Растёт доля 5xx | технический дашборд; логи по `requestId`; недавние изменения |
| Переполнение диска | `docker system df`; свободное место; очистка старых томов |
| Пустые технические графики | API не запущен или target в Prometheus = DOWN |
| Пустые прикладные панели | datasource Postgres / нет данных после seed |
