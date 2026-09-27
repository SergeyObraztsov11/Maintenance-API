# Maintenance API

REST API на Express для учёта оборудования и заявок на техническое обслуживание.  
Данные хранятся в **PostgreSQL** (Sequelize + миграции).

## Требования к окружению

- Node.js **20+**
- npm
- Docker Desktop (PostgreSQL)
- (опционально) Postman для проверки коллекции

## Установка и запуск

```bash
git clone https://github.com/SergeyObraztsov11/Maintenance-API.git
cd Maintenance-API
npm install
cp .env.example .env
docker compose up -d db
npm run db:migrate
npm run seed
npm start
```

Режим с автоперезапуском:

```bash
npm run dev
```

Проверка: [http://localhost:3000/api/health](http://localhost:3000/api/health) -> `{"status":"ok"}`.

### Docker

```bash
cp .env.example .env
npm run docker:up
# или: npm run docker:build && docker run --rm -p 3000:3000 --env-file .env maintenance-api
```

Остановка: `npm run docker:down`.

### База данных

Развёртывание с нуля (после `cp .env.example .env` и `npm install`):

```bash
docker compose up -d db
npm run db:migrate
npm run seed
npm start
```

Схема создаётся только миграциями (`sync({ force })` не используется).

#### Откат миграций и восстановление

Откатить последнюю миграцию:

```bash
npm run db:migrate:undo
```

Откатить все миграции (таблицы удаляются; данные сидов тоже):

```bash
npm run db:migrate:undo:all
```

Восстановить окружение после полного отката:

```bash
npm run db:migrate
npm run seed
```

Если нужно «с нуля» и контейнер: `docker compose down -v` (удалит том Postgres), затем снова `docker compose up -d db` → migrate → seed.
## npm-скрипты

| Команда | Действие |
|---------|------------|
| `npm start` | запуск сервера |
| `npm run dev` | запуск с автоперезапуском |
| `npm run seed` | наполнение БД демо-данными |
| `npm run lint:check` | проверка ESLint |
| `npm run lint:fix` | ESLint с автоисправлением |
| `npm run format:check` | проверка Prettier |
| `npm run format:fix` | форматирование Prettier |
| `npm run check` | lint + format (только проверка) |
| `npm run fix` | lint + format (исправление) |
| `npm run docker:build` | сборка Docker-образа API |
| `npm run docker:up` | поднять compose (сборка + фон) |
| `npm run docker:down` | остановить compose |
| `npm run docker:logs` | логи сервиса api |
| `npm run db:migrate` | применить миграции |
| `npm run db:migrate:undo` | откатить последнюю миграцию |
| `npm run db:migrate:undo:all` | откатить все миграции |
| `npm run db:show-tables` | список таблиц в БД |
| `npm run db:show-table -- [table_name]` | просмотр структуры таблицы в консоли |
| `npm run db:show-table-data -- [table_name]` | просмотр данных таблицы в консоли |

## Переменные окружения

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `PORT` | `3000` | Порт HTTP-сервера |
| `NODE_ENV` | `development` | Режим (`production` скрывает внутренние сообщения ошибок) |
| `CORS_ORIGINS` | `http://localhost:5500` | Разрешённые origin через запятую |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Окно rate limit, мс |
| `RATE_LIMIT_MAX` | `100` | Максимум запросов к `/api` за окно |
| `REQUEST_TIMEOUT_MS` | `5000` | Таймаут запроса к погодному API |
| `FORECAST_BASE_URL` | `https://api.open-meteo.com` | Базовый URL прогноза |
| `WEATHER_WIND_MAX_MS` | `12` | Порог ветра (м/с) для наружных работ |
| `WEATHER_PRECIPITATION_MAX_MM` | `0.1` | Порог осадков (мм) |
| `LOG_LEVEL` | `info` | Уровень логов: `error` / `warn` / `info` / `debug` |
| `API_KEY` | `dev-api-key-change-me` | Ключ для POST / PATCH / DELETE (заголовок `X-API-Key`) |
| `DB_HOST` | `localhost` | Хост PostgreSQL |
| `DB_PORT` | `5433` | Порт PostgreSQL на хосте (внутри контейнера — 5432) |
| `DB_NAME` | `maintenance` | Имя базы |
| `DB_USER` | `maintenance` | Пользователь |
| `DB_PASSWORD` | `maintenance` | Пароль |
| `DB_POOL_MIN` | `0` | Минимум соединений в пуле |
| `DB_POOL_MAX` | `10` | Максимум соединений в пуле |

## Эндпоинты

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/health` | Проверка доступности |
| GET | `/api/equipment` | Список оборудования (фильтры, сортировка, пагинация) |
| POST | `/api/equipment` | Создание оборудования |
| GET | `/api/equipment/:id` | Карточка оборудования |
| PATCH | `/api/equipment/:id` | Частичное обновление |
| DELETE | `/api/equipment/:id` | Удаление (запрещено при открытых заявках) |
| GET | `/api/equipment/:id/requests` | Заявки по единице оборудования |
| GET | `/api/equipment/:id/weather` | Прогноз и пригодность окна для наружных работ |
| GET | `/api/requests` | Список заявок |
| POST | `/api/requests` | Создание заявки |
| GET | `/api/requests/:id` | Карточка заявки |
| PATCH | `/api/requests/:id` | Редактирование полей |
| PATCH | `/api/requests/:id/status` | Смена статуса с проверкой перехода |
| DELETE | `/api/requests/:id` | Удаление заявки |
| GET | `/api/requests/:id/history` | Журнал изменений статуса |
| POST | `/api/requests/:id/assignees` | Назначение бригады (замена списка) |
| DELETE | `/api/requests/:id/assignees/:technicianId` | Снятие специалиста |
| GET | `/api/sites/:id/summary` | Сводка по площадке |
| GET | `/api/reports/sites/:id/summary` | То же (alias) |
| GET | `/api/reports/equipment-load` | Нагрузка на оборудование |
| GET | `/api/reports/technicians/workload` | Нагрузка специалистов |

Query для списков (примеры): `status`, `type` / `priority`, `equipmentId`, `createdAtFrom`, `createdAtTo`, `installedAtFrom` / `installedAtTo` (equipment), `plannedAtFrom` / `plannedAtTo` (requests), `sortBy`, `sortOrder`, `page`, `limit`.  
Для weather: `days` (1–7, по умолчанию 3).

## Схема БД

![ER-диаграмма](docs/er-diagram.jpg)

| Связь | Тип | Реализация |
|-------|-----|------------|
| Площадка → оборудование | 1:N | `equipment.site_id` |
| Оборудование → паспорт | 1:1 | `equipment_passports.equipment_id` UNIQUE |
| Оборудование → заявки | 1:N | `maintenance_requests.equipment_id` |
| Заявка → журнал статусов | 1:N | `request_status_history.request_id` |
| Заявки ↔ специалисты | N:M | `request_assignees` (`role`, `hours`), UNIQUE `(request_id, technician_id)` |

Координаты хранятся у площадки. В ответе API у оборудования поле `location` собирается из связанного site (контракт кейса 2).  
В карточке оборудования дополнительно отдаётся паспорт, в карточке заявки — assignees.

### Нормализация

Схема приведена к 3НФ:

- **Площадка отдельно от оборудования.** Координаты, код и регион относятся к площадке, а не к каждой единице. Иначе одни и те же `lat`/`lon` дублировались бы на всём оборудовании площадки.
- **Паспорт — отдельная таблица 1:1.** Производитель, модель и мощность — атрибуты паспорта, не статус эксплуатации. Уникальный `equipment_id` гарантирует один паспорт на единицу.
- **Журнал статусов отдельно от заявки.** История — append-only: смена статуса пишет новую строку, прошлые записи не правятся. Так заявка хранит только текущий статус, а аудит — в `request_status_history`.
- **Специалисты и назначения — N:M через `request_assignees`.** Роль (`lead`/`member`) и часы — атрибуты связи, не специалиста и не заявки. UNIQUE `(request_id, technician_id)` запрещает повторное назначение на уровне БД.

### Правила удаления (ON DELETE)

| Связь | Правило | Зачем |
|-------|---------|--------|
| site → equipment | `RESTRICT` | нельзя удалить площадку с оборудованием |
| equipment → passport | `CASCADE` | паспорт исчезает вместе с оборудованием |
| equipment → requests | `RESTRICT` | нельзя удалить оборудование при заявках; сервис дополнительно запрещает удаление при незакрытых заявках (409) |
| request → history / assignees | `CASCADE` | при удалении заявки чистятся журнал и назначения |
| technician → assignees | `RESTRICT` | нельзя удалить специалиста, пока он назначен на заявки |

## Модель данных

### Оборудование (`equipment`)

| Поле | Тип | Правила |
|------|-----|---------|
| `id` | string (uuid) | Генерирует сервер |
| `name` | string | 3–100 символов, обязательно |
| `type` | enum | `turbine` \| `inverter` \| `sensor` \| `substation` |
| `serialNumber` | string | Уникальный в системе |
| `location` | `{ lat, lon }` | Координаты объекта |
| `status` | enum | `operational` \| `maintenance` \| `fault` \| `decommissioned` |
| `installedAt` | ISO-дата | Не в будущем |
| `createdAt` / `updatedAt` | ISO date-time | Выставляет сервер |

### Заявка (`maintenance request`)

| Поле | Тип | Правила |
|------|-----|---------|
| `id` | string (uuid) | Генерирует сервер |
| `equipmentId` | string | Ссылка на существующее оборудование |
| `title` | string | 5–120 символов, обязательно |
| `description` | string | До 2000 символов |
| `priority` | enum | `low` \| `medium` \| `high` \| `critical` |
| `status` | enum | `new` \| `in_progress` \| `done` \| `rejected` (по умолчанию `new`) |
| `plannedAt` | ISO date-time | Необязательно |
| `author` | string | Автор заявки |
| `createdAt` / `updatedAt` | ISO date-time | Выставляет сервер |

### Переходы статуса заявки

```text
new -> in_progress -> done
new -> rejected
in_progress -> rejected
```

Из `done` и `rejected` переходы запрещены -> **409 Conflict**.

Дополнительно:

- смена статуса и запись в `request_status_history` выполняются в одной транзакции;
- переход в `in_progress` без assignees запрещён (409);
- назначение бригады — одной транзакцией (полная замена списка), ровно один `lead` иначе 422;
- повтор одного `technicianId` в списке запрещён (422).

## Формат ошибки

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      { "field": "name", "message": "Too small: expected string to have >=3 characters" }
    ],
    "requestId": "b1f2c3d4-...."
  }
}
```

Типичные коды: `VALIDATION_ERROR` (422), `NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMIT_EXCEEDED` (429), `WEATHER_PROVIDER_ERROR` (502), `INTERNAL_ERROR` (500).

## Примеры запросов и ответов

### Создание оборудования

`POST /api/equipment`

```json
{
  "name": "Turbine A1",
  "type": "turbine",
  "serialNumber": "SN-T-001",
  "location": { "lat": 55.75, "lon": 37.61 },
  "status": "operational",
  "installedAt": "2024-01-15"
}
```

Ответ **201** + заголовок `Location`:

```json
{
  "data": {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Turbine A1",
    "type": "turbine",
    "serialNumber": "SN-T-001",
    "location": { "lat": 55.75, "lon": 37.61 },
    "status": "operational",
    "installedAt": "2024-01-15",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### Список с метаданными

`GET /api/equipment?status=operational&page=1&limit=10`

```json
{
  "data": [ /* ... */ ],
  "meta": { "total": 2, "page": 1, "limit": 10 }
}
```

### Смена статуса заявки

`PATCH /api/requests/{id}/status`

```json
{ "status": "in_progress" }
```

Недопустимый переход (например `new` -> `done`) -> **409**.

### Погода по оборудованию

`GET /api/equipment/{id}/weather?days=3`

В ответе: координаты, правила пригодности из env, прогноз по дням с флагом `suitableForOutdoorWork`.  
День пригоден, если осадки ≤ `WEATHER_PRECIPITATION_MAX_MM` и ветер ≤ `WEATHER_WIND_MAX_MS`.  
Скорость ветра запрашивается у Open-Meteo в м/с (`wind_speed_unit=ms`), чтобы совпадать с порогом в env.

### Назначение бригады

`POST /api/requests/{id}/assignees` — **полная замена** назначений в одной транзакции.

```json
{
  "assignees": [
    { "technicianId": "...", "role": "lead", "hours": 4 },
    { "technicianId": "...", "role": "member", "hours": 2 }
  ]
}
```

В списке должен быть ровно один `lead`. Иначе → **422** и откат.  
Несуществующий специалист → **404**.  
`DELETE /api/requests/{id}/assignees/{technicianId}` — снять одного.

### Отчёты

Отчёты считаются **raw SQL** с параметризованными подстановками (без конкатенации ввода в текст запроса).

**Сводка по площадке** — `GET /api/sites/{id}/summary`  
(alias: `GET /api/reports/sites/{id}/summary`)

- данные площадки (`id`, `name`, `code`, `region`);
- число единиц оборудования и разбивка по `status`;
- число заявок: разбивка по `status` и по `priority`;
- `avgCloseTimeHours` — среднее время от создания заявки до первого перехода в `done` (часы; `null`, если закрытых нет).

Несуществующая площадка → **404**.

**Нагрузка на оборудование** — `GET /api/reports/equipment-load`

Query (опционально): `from`, `to` (ISO, фильтр по `created_at` заявки), `minRequests` (HAVING, по умолчанию `0`).

По каждой единице:
- `requestsCount`, `closedRequestsCount`;
- `totalPlannedHours` (сумма `request_assignees.hours`);
- `lastServicedAt` (время последнего перехода заявки в `done`).

**Нагрузка специалистов** — `GET /api/reports/technicians/workload`

- по каждому специалисту: `assignmentsCount`, `totalHours`;
- сортировка по убыванию часов.

### Ошибка валидации

`POST /api/equipment` с `{ "name": "ab" }` -> **422** и массив `details`.

### Дубль серийного номера

Повторный `serialNumber` -> **409 Conflict**.

## Безопасность

- **CORS** — только origin из `CORS_ORIGINS` (не `*`). По умолчанию `http://localhost:5500` — типичный origin для статической HTML-страницы (Live Server). Добавляйте свои фронтенд-origin через запятую.
- **Rate limit** — на префикс `/api`: при превышении **429**, заголовки `RateLimit-*`, в теле единый формат ошибки с `requestId`.
- **Helmet** — защитные HTTP-заголовки.
- **Лимит тела** — `express.json({ limit: "100kb" })`.
- **API-ключ** — для `POST` / `PATCH` / `DELETE` нужен заголовок `X-API-Key` со значением из `API_KEY`. `GET` и `/api/health` без ключа.
- **Секреты** — только в `.env`, не в репозитории. В `production` стек и внутренние детали в ответ не отдаются.
- Cookie в проекте не используются.

## Логирование

Каждый запрос логируется (JSON): метод, путь, код ответа, длительность, `requestId`.  
Идентификатор также возвращается в заголовке `X-Request-Id` и в теле ошибки.

## Postman

Коллекция: [`docs/postman/maintenance-api.postman_collection.json`](docs/postman/maintenance-api.postman_collection.json)

Import в Postman → `docker compose up -d db` → `npm run db:migrate` → `npm run seed` → `npm start`.

Порядок папок: **Health** → **Setup** → **Equipment** → **Requests** → **Reports** → **Negative**.

### Сценарии в коллекции

**Health**
- GET health

**Setup**
- Resolve seed IDs (сохраняет `siteId`, `technicianId`, `technicianId2` из сидов)

**Equipment**
- POST create equipment
- GET list equipment
- GET equipment by id
- PATCH update equipment
- GET equipment weather
- GET equipment requests

**Requests**
- POST create request
- GET list requests
- GET request by id
- PATCH update request
- POST set assignees (lead + member)
- PATCH change status to `in_progress`
- GET request status history
- DELETE assignee (member)
- DELETE request
- DELETE equipment

**Reports**
- GET site summary (`/api/sites/:id/summary`)
- GET equipment load (`/api/reports/equipment-load`)
- GET technicians workload (`/api/reports/technicians/workload`)

**Negative**
- 422 validation error — short name
- 404 equipment not found
- 409 duplicate serial number
- 409 invalid status transition
- 429 rate limit
- 409 `in_progress` without assignees
- 404 assignee unknown technician
- 422 assignees without lead
- 422 assignee invalid role
- 404 site summary not found

## Демо-данные

```bash
npm run seed
```

Заполняет PostgreSQL демо-данными (площадки, оборудование, паспорта, специалисты, заявки, history, assignees).

## Структура проекта

```text
src/
  app.js                 # сборка Express (без listen)
  server.js              # запуск HTTP-сервера, подключение к БД
  config/                # конфигурация из env
  db/                    # Sequelize, миграции
  models/                # модели и ассоциации
  routes/                # маршруты
  controllers/           # HTTP-слой
  services/              # бизнес-логика
  repositories/          # доступ к PostgreSQL
  validators/            # схемы Zod
  middlewares/           # validate, requestId, logger, 404, errors, ...
  errors/                # типы ошибок приложения
  weather/               # клиент Open-Meteo (кейс 1)
  logger/                # уровни логирования
  scripts/seedDb.js      # демо-данные
docs/
  er-diagram.jpg         # ER-диаграмма
  postman/               # коллекция Postman
```

Слои: **routes -> controllers -> services -> repositories**.  
Погодный модуль вызывается из `weatherService`, не из контроллера напрямую.
