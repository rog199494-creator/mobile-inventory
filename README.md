# Mobile Inventory System - TSD Replacement

A professional mobile inventory management system that transforms smartphones into portable data terminals for retail stocktaking, inspired by e-revision.ru.

## Features

✅ **Session Management** - Create and manage multiple inventory counting sessions
✅ **Excel/CSV Import** - Upload your expected inventory from spreadsheets
✅ **1С / SAP Integration** - File-based exchange with 1С Розница and SAP (CSV + XLSX, no network required)
✅ **Mobile Scanner** - Scan barcodes and record quantities on any device
✅ **Offline Support** - Continue scanning even without internet connection
✅ **Real-time Progress** - Monitor scanning progress across multiple users
✅ **Variance Analysis** - Automatic calculation of shortages, surpluses, and unknown items
✅ **Excel Export** - Download variance reports for accounting systems

## How to Use

### 1. Create a New Session

Click "New Session" and provide:
- Session name (e.g., "Monthly Inventory - January 2024")
- Store/location name (manual entry or via Telegram Mini App)
- Upload a CSV file with your expected inventory

#### Store Selection Options

**Option A: Manual Entry**
Simply type the store name directly into the "Store/location" field.

**Option B: Telegram Mini App Integration** (Available when running in Telegram)
1. Enter the URL of your store management mini app (e.g., `https://t.me/your_store_bot/app`)
2. Click "Select store from app"
3. Your external store app will open
4. Select the desired store
5. Store name and ID will automatically populate

The app URL is saved for future use. See [TELEGRAM_INTEGRATION.md](TELEGRAM_INTEGRATION.md) for implementation details.

### 2. CSV File Format

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

### 3. Start Scanning

- Select an active session and click "Scan"
- Enter barcodes manually or scan with camera (simulation mode)
- Adjust quantities using +/- buttons
- System automatically tracks:
  - Total items scanned
  - Unique products counted
  - Scanning progress percentage

### 4. Offline Mode

The app works without internet:
- All scans are saved locally
- Offline indicator shows pending sync count
- Automatic sync when connection restored

### 5. View Results

Click "View Details" on any session to see:
- **Shortages** - Items with less stock than expected (highlighted red)
- **Surpluses** - Items with more stock than expected (highlighted green)
- **Unknown** - Items scanned but not in original list (highlighted amber)
- **Matches** - Items with exact quantities

Export results as CSV for uploading to your accounting system.

## Sample Data

The application includes 3 demo sessions:
1. **Active Session** - Currently in progress with partial scans
2. **Completed Session** - Finished inventory with all variances calculated
3. **Planned Session** - Ready to start, no scans yet

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
