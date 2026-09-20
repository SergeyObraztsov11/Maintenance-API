# Maintenance API

REST API на Express для учёта оборудования и заявок на техническое обслуживание (например, ветропарк).  
Сервис хранит данные в JSON-файлах через слой репозитория, проверяет жизненный цикл заявок и оценивает погодные условия на объекте для наружных работ (модуль Open-Meteo из кейса 1).

## Требования к окружению

- Node.js **20+**
- npm
- (опционально) Postman для проверки коллекции

## Установка и запуск

```bash
git clone https://github.com/SergeyObraztsov11/Maintenance-API.git
cd Maintenance-API
npm install
cp .env.example .env
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

Остановка: `npm run docker:down`. Данные в `./data` монтируются в контейнер.

## Проверка кода

```bash
npm run lint:check      # ESLint
npm run lint:fix        # ESLint, автоисправление
npm run format:check    # Prettier, проверка
npm run format:fix      # Prettier, форматирование
npm run check           # lint + format (проверка)
npm run fix             # lint + format (исправление)
```

## Переменные окружения

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `PORT` | `3000` | Порт HTTP-сервера |
| `NODE_ENV` | `development` | Режим (`production` скрывает внутренние сообщения ошибок) |
| `CORS_ORIGINS` | `http://localhost:5500` | Разрешённые origin через запятую |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Окно rate limit, мс |
| `RATE_LIMIT_MAX` | `3` | Максимум запросов к `/api` за окно |
| `REQUEST_TIMEOUT_MS` | `5000` | Таймаут запроса к погодному API |
| `FORECAST_BASE_URL` | `https://api.open-meteo.com` | Базовый URL прогноза |
| `WEATHER_WIND_MAX_MS` | `12` | Порог ветра (м/с) для наружных работ |
| `WEATHER_PRECIPITATION_MAX_MM` | `0.1` | Порог осадков (мм) |
| `DATA_DIR` | `data` | Каталог JSON-хранилища |
| `LOG_LEVEL` | `info` | Уровень логов: `error` / `warn` / `info` / `debug` |
| `API_KEY` | `dev-api-key-change-me` | Ключ для POST / PATCH / DELETE (заголовок `X-API-Key`) |

Файл `.env` в репозиторий не коммитится. Образец — `.env.example`.

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
| PATCH | `/api/requests/:id` | Редактирование полей (не статуса) |
| PATCH | `/api/requests/:id/status` | Смена статуса с проверкой перехода |
| DELETE | `/api/requests/:id` | Удаление заявки |

Query для списков (примеры): `status`, `type` / `priority`, `equipmentId`, `createdAtFrom`, `createdAtTo`, `installedAtFrom` / `installedAtTo` (equipment), `plannedAtFrom` / `plannedAtTo` (requests), `sortBy`, `sortOrder`, `page`, `limit`.  
Для weather: `days` (1–7, по умолчанию 3).

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
| `createdAt` / `updatedAt` | ISO date-time | Выставляет сервер |

### Переходы статуса заявки

```text
new -> in_progress -> done
new -> rejected
in_progress -> rejected
```

Из `done` и `rejected` переходы запрещены -> **409 Conflict**.

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

Import в Postman -> `npm start` -> сначала **POST create equipment**, затем **POST create request**.  
В коллекции есть негативные сценарии (422 / 404 / 409 / 429) и `pm.test`.

## Демо-данные

```bash
npm run seed
```

Записывает примеры в `data/equipment.json` и `data/requests.json` (каталог `data/*` в git не хранится, кроме `.gitkeep`).

## Структура проекта

```text
src/
  app.js                 # сборка Express (без listen)
  server.js              # запуск HTTP-сервера
  config/                # конфигурация из env
  routes/                # маршруты
  controllers/           # HTTP-слой
  services/              # бизнес-логика
  repositories/          # доступ к JSON-данным
  validators/            # схемы Zod
  middlewares/           # validate, requestId, logger, 404, errors, ...
  errors/                # типы ошибок приложения
  weather/               # клиент Open-Meteo (кейс 1)
  logger/                # уровни логирования
  scripts/seed.js        # демо-данные
docs/postman/            # коллекция Postman
data/                    # JSON-хранилище (локально)
```

Слои: **routes -> controllers -> services -> repositories**.  
Погодный модуль вызывается из `weatherService`, не из контроллера напрямую.
