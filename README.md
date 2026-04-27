# Mobile Inventory System - TSD Replacement

A professional mobile inventory management system that transforms smartphones into portable data terminals for retail stocktaking, inspired by e-revision.ru.

## Features

✅ **Session Management** - Create and manage multiple inventory counting sessions
✅ **Excel/CSV Import** - Upload your expected inventory from spreadsheets
✅ **1С / SAP Integration** - File-based exchange with 1С Розница and SAP (CSV + XLSX, no network required)
✅ **Server Integration** - Connect to client's Bitrix24-integrated Node.js server
✅ **Telegram Mini App** - Run inside Telegram with native UI, auth, and automatic theme (light/dark) from `themeParams`
✅ **Mobile Scanner** - Scan barcodes and record quantities on any device
✅ **Offline Support** - Continue scanning even without internet connection
✅ **Real-time Progress** - Monitor scanning progress across multiple users
✅ **Variance Analysis** - Automatic calculation of shortages, surpluses, and unknown items
✅ **Excel Export** - Download variance reports for accounting systems

## How to Use

### 1. Create a New Session

Click **«Новая сессия»** and:
- Enter a session name (e.g., "Инвентаризация — Январь 2024")
- Optionally select an **object** (location) from the Bitrix list — grouped by company.
  - If your object is not yet loaded, simply skip the selection.
- Upload a CSV file with your expected inventory (or skip and add products later)

### 2. Selecting an Object (Optional)

Objects are loaded from the connected Bitrix server via `api.getStores()` and displayed grouped by company.

- **With object selected** — `storeId`, `storeName`, `storeAddress`, `companyId`, `companyName` are saved to the session.
- **Without object** — the session is created without location binding; the card shows "Объект не указан".

You can also create sessions by going to **«Объекты»** → select a company → select an object → **«Начать инвентаризацию»**.

### 3. CSV File Format

Your CSV should have the following columns:

```csv
Barcode,Product Name,Expected Qty,Price
8901234567890,Premium Coffee Beans 500g,150,12.99
8901234567891,Organic Green Tea 100g,200,8.50
8901234567892,Dark Chocolate Bar 100g,300,4.25
```

**Required columns:**
- `Barcode` - Product barcode/SKU
- `Product Name` - Full product description
- `Expected Qty` - Current book inventory quantity
- `Price` - Unit price (for calculating variance value)

### 4. Start Scanning

- Select an active session and click "Сканировать"
- Enter barcodes manually or scan with camera
- Adjust quantities using +/- buttons
- System automatically tracks:
  - Total items scanned
  - Unique products counted
  - Scanning progress percentage

### 5. Offline Mode

The app works without internet:
- All scans are saved locally
- Offline indicator shows pending sync count
- Automatic sync when connection restored

### 6. View Results

Click "Подробнее" on any session to see:
- **Недостача** - Items with less stock than expected (highlighted red)
- **Излишки** - Items with more stock than expected (highlighted green)
- **Неизвестные** - Items scanned but not in original list (highlighted amber)
- **Совпадения** - Items with exact quantities

Export results as CSV or XLSX for uploading to your accounting system.

### 7. Clear All Sessions

In the header click **«Очистить все»** to delete all saved sessions (with confirmation dialog). The button is disabled when there are no sessions.

## Интеграция с 1С (файлы)

Приложение поддерживает файловый обмен с **1С: Розница**, **1С: УТ**, **1С: УНФ** и **SAP** — без сетевых подключений, паролей и HTTP-сервисов.

### Принцип работы

```
[1С] → экспортировать остатки → файл CSV/XLSX → загрузить в приложение
[Приложение] → результаты ревизии → файл CSV/XLSX → загрузить в 1С
```

### Кнопка «Импорт из 1С»

1. В главном экране нажмите **«Импорт из 1С»**.
2. Выберите файл CSV или XLSX с остатками, выгруженный из 1С.
3. Приложение покажет превью: количество найденных позиций, название склада и список ошибочных строк (если есть).
4. Нажмите **«Начать ревизию»** — сессия создаётся автоматически.

### Кнопка «Экспорт для 1С»

После завершения ревизии в экране анализа нажмите:
- **«1С CSV»** — скачать файл результатов в формате CSV (UTF-8 BOM, разделитель `;`)
- **«1С XLSX»** — скачать файл результатов в формате Excel

Файл именуется автоматически: `revision-<Склад>-<YYYY-MM-DD>.csv|xlsx`

### Формат файлов

Подробная спецификация формата — в документе **[docs/1C_FILE_FORMAT.md](docs/1C_FILE_FORMAT.md)**:
- Описание колонок импорта и экспорта
- Примеры CSV и XLSX
- Инструкция «Как выгрузить остатки из 1С Розница»
- Инструкция «Как загрузить результаты в 1С»

### Поддерживаемые форматы

| Формат | Импорт | Экспорт |
|--------|:------:|:-------:|
| CSV (`;`) | ✅ | ✅ |
| CSV (`,`) | ✅ | — |
| XLSX / XLS | ✅ | ✅ |

Приложение работает **полностью офлайн** — интеграция не требует сети.

## Подключение к серверу клиента

Приложение умеет подключаться к серверу клиента (Node.js + Express, интегрированному с Bitrix24) для получения списка объектов, финансов и данных ККТ.

### Переменные окружения

Скопируйте `.env.example` в `.env.local` и заполните:

```
VITE_API_BASE_URL=https://minitest.bitrixabd.ru/api/bitrix
VITE_DEBUG_USER_ID=<ваш_id_для_отладки>
```

### Dev-прокси (обход CORS при локальной разработке)

Запросы `/api/*` автоматически проксируются через Vite на `https://minitest.bitrixabd.ru`. Дополнительная настройка не нужна.

```bash
npm run dev
# Запросы к /api/bitrix/* → https://minitest.bitrixabd.ru/api/bitrix/*
```

### Документация API

Полный контракт всех эндпоинтов — в **[docs/API_CONTRACT.md](docs/API_CONTRACT.md)**.

### Экран «Объекты»

Нажмите кнопку **«Объекты»** на главном экране для:
- Проверки соединения с сервером (`ping`)
- Загрузки списка компаний и объектов (`getStores`)

## Запуск как Telegram Mini App

Приложение поддерживает запуск внутри Telegram через `@ab_mini_test_bot`.

- При запуске в Telegram автоматически применяется тема, приложение разворачивается на весь экран.
- Цвета берутся из `tg.themeParams` — интерфейс автоматически переключается в тёмную тему, если Telegram работает в тёмном режиме.
- Авторизация запросов к серверу — через стандартный заголовок `Authorization: tma <initData>`.
- При запуске в браузере (разработка) — graceful fallback без ошибок, системная тема определяется через `prefers-color-scheme`.

### Debug-панель тем (`npm run dev`)

В режиме разработки в правом нижнем углу отображается панель **Light / Dark / Telegram** для быстрого переключения тем без перезагрузки.

Также поддерживается query-параметр:
```
?theme=dark   → тёмная тема
?theme=light  → светлая тема
?theme=tg     → мок Telegram Desktop цветов
```

Инструкция по настройке бота и теме — в **[docs/TELEGRAM_MINIAPP.md](docs/TELEGRAM_MINIAPP.md)**.

## Technical Notes

- All data persists in browser storage
- Sessions are never deleted automatically
- Multiple users can scan simultaneously (data merges automatically)
- Duplicate barcode scans accumulate quantities
- Unknown items are flagged for review but still recorded

## Support

For CSV format issues, ensure:
- File is saved as `.csv` or `.txt`
- Commas separate columns (not semicolons)
- No special characters in product names
- Prices use decimal points (not commas)
