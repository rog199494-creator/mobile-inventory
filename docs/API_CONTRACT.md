# API Contract — minitest.bitrixabd.ru

> **Единый источник правды** для всех эндпоинтов сервера клиента.  
> Сервер: Node.js + Express, интегрирован с Bitrix24.  
> Код сервера живёт отдельно (`/home/alxnsk/Servers/MiniTest/server`) и **не переносится** в этот репозиторий.

---

## Общие соглашения

### Базовый URL

```
https://minitest.bitrixabd.ru/api/bitrix
```

> **TODO**: уточнить точное значение у разработчика сервера.  
> Переменная окружения: `VITE_API_BASE_URL` (см. `.env.example`).  
> В dev-режиме запросы проксируются через Vite: `/api/bitrix → https://minitest.bitrixabd.ru/api/bitrix`.

### Формат-конверт

Все ответы сервера приходят в одном из двух форматов:

**Успех:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Ошибка:**
```json
{
  "success": false,
  "error": "Текст ошибки"
}
```

### Аутентификация (Telegram Mini App)

Заголовок: `Authorization: tma <initData>`

`initData` — строка из `window.Telegram.WebApp.initData`, автоматически подставляется клиентом при запуске внутри Telegram.

> Подробнее об алгоритме валидации `initData` на стороне сервера — см. [`docs/TELEGRAM_MINIAPP.md`](./TELEGRAM_MINIAPP.md).

**В режиме разработки (вне Telegram):**  
Заголовок: `X-Debug-User-Id: <значение из VITE_DEBUG_USER_ID>`

---

## Эндпоинты

### `GET /bitrix/stores`

Список компаний и объектов пользователя.

**Заголовки:**
```
Authorization: tma <initData>
```

**Параметры:** нет

**Пример ответа (успех):**
```json
{
  "success": true,
  "data": {
    "companies": [
      { "id": "69816", "name": "ООО \"ГК НОВИКОВ\"" },
      { "id": "130914", "name": "АО \"ПРАЙМ ПРИНТ МОСКВА\"" }
    ],
    "stores": [
      {
        "id": "2575",
        "name": "Объект 2575",
        "address": "мо. Кировский, кп. Горные Ключи, ул. Цымбалюка, стр. 1",
        "companyId": "69816"
      },
      {
        "id": "3751",
        "name": "Огонёк",
        "address": "г. Москва, пр-кт. Андропова, д. 10А",
        "companyId": "69816"
      }
    ]
  }
}
```

**Поля `data`:**

| Поле | Тип | Описание |
|---|---|---|
| `companies` | `Company[]` | Список компаний пользователя |
| `companies[].id` | `string` | Идентификатор компании |
| `companies[].name` | `string` | Название компании |
| `stores` | `Store[]` | Список объектов (торговых точек) |
| `stores[].id` | `string` | Идентификатор объекта |
| `stores[].name` | `string` | Название объекта |
| `stores[].address` | `string?` | Адрес объекта |
| `stores[].companyId` | `string` | ID компании-владельца |

---

### `GET /bitrix/company/:companyId`

Детали компании и оборудование.

**Параметры пути:**
- `companyId` — идентификатор компании

**Заголовки:**
```
Authorization: tma <initData>
```

**Пример ответа (успех):**
```json
{
  "success": true,
  "data": {
    "id": "69816",
    "name": "ООО \"ГК НОВИКОВ\"",
    "equipment": []
  }
}
```

> **TODO**: уточнить полную структуру `data` у разработчика сервера (состав полей, структура `equipment`).

---

### `GET /bitrix/company/:companyId/finance`

Финансовые данные компании по периодам.

**Параметры пути:**
- `companyId` — идентификатор компании

**Заголовки:**
```
Authorization: tma <initData>
```

**Пример ответа (успех):**
```json
{
  "success": true,
  "data": {
    "active": [
      {
        "id": "2026_3",
        "month": "Март 2026",
        "invoices": [
          { "id": "11654", "title": "сделка АБ/11654" }
        ]
      }
    ],
    "upcoming": [
      {
        "id": "2026_9",
        "month": "Сентябрь 2026",
        "invoices": [
          {
            "id": "kkt_886697",
            "title": "Замена ФН: Огонёк — АТОЛ 55Ф",
            "description": "Срок до 17.09.2026"
          }
        ]
      },
      {
        "id": "2026_7",
        "month": "Июль 2026",
        "invoices": [
          {
            "id": "kkt_658586",
            "title": "Замена ФН: Объект 3748 — АТОЛ 77Ф",
            "description": "Срок до 02.07.2026"
          }
        ]
      }
    ],
    "archived": [
      {
        "id": "2025_8",
        "month": "Август 2025",
        "invoices": []
      }
    ]
  }
}
```

**Поля `data`:**

| Поле | Тип | Описание |
|---|---|---|
| `active` | `FinancePeriod[]` | Текущие (активные) периоды |
| `upcoming` | `FinancePeriod[]` | Предстоящие периоды |
| `archived` | `FinancePeriod[]` | Архивные периоды |
| `FinancePeriod.id` | `string` | Идентификатор периода, например `"2026_3"` |
| `FinancePeriod.month` | `string` | Название периода, например `"Март 2026"` |
| `FinancePeriod.invoices` | `FinanceInvoice[]` | Счета/события периода |
| `FinanceInvoice.id` | `string` | Идентификатор счёта |
| `FinanceInvoice.title` | `string` | Название счёта |
| `FinanceInvoice.description` | `string?` | Дополнительное описание |

---

### `GET /bitrix/kassa/:kassaId`

Информация по кассе / ККТ.

**Параметры пути:**
- `kassaId` — идентификатор кассы

**Заголовки:**
```
Authorization: tma <initData>
```

> **TODO**: структура ответа уточняется у разработчика сервера.

---

### `GET /bitrix/calendar/:userId`

Календарь обслуживания пользователя.

**Параметры пути:**
- `userId` — идентификатор пользователя

**Заголовки:**
```
Authorization: tma <initData>
```

> **TODO**: структура ответа уточняется у разработчика сервера.

---

### `GET /bitrix/order/:orderId`

Детали заказа / счёта.

**Параметры пути:**
- `orderId` — идентификатор заказа

**Заголовки:**
```
Authorization: tma <initData>
```

> **TODO**: структура ответа уточняется у разработчика сервера.

---

## Системные эндпоинты

### `GET /bitrix/version`

Возвращает версию сервера.

**Пример ответа:**
```json
{
  "success": true,
  "data": { "version": "1.0.0" }
}
```

---

### `GET /bitrix/`

Health-check сервера.

**Пример ответа:**
```json
{
  "status": "OK",
  "message": "Server is running",
  "time": "2026-04-27T17:00:00.000Z"
}
```

> Этот эндпоинт возвращает ответ **напрямую**, без конверта `{ success, data }`.

---

## TODO — не реализованы в этом PR

- **Отправка результатов ревизии**: требуется уточнить у разработчика сервера, как передавать результаты — через файл, через новый `POST`-эндпоинт, или через `tg.sendData()` боту.

---

## Архитектура подключения

```
[Telegram Mini App: наше приложение]
        │  Authorization: tma <initData>
        ▼
[Сервер клиента: minitest.bitrixabd.ru]
   /bitrix/stores, /bitrix/company/:id, /bitrix/company/:id/finance,
   /bitrix/kassa/:id, /bitrix/calendar/:userId, /bitrix/order/:id
        │
        ▼
[Bitrix24 / база данных]
```
