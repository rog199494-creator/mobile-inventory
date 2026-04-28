# Серверная интеграция с Telegram-ботом

Этот документ описывает серверные эндпоинты и логику бота, которые должен реализовать
бэкенд-разработчик (Express + grammy на `127.0.0.1:9002`).

Фронтовая часть уже реализована: `src/services/api.ts` → `inventoryApi`.
Как только сервер реализует перечисленные ниже маршруты — функции «Отправить в Telegram»
и «Импорт из Telegram» заработают без изменений во фронте.

---

## Архитектурный обзор

```
Mini App (браузер)
     │  Authorization: tma <initData>
     ▼
Apache → /inventory/* → 127.0.0.1:9002/inventory/*
     │
     ▼
Express server (grammy bot)
     ├─ POST /inventory/export          ← фронт отправляет XLSX, бот шлёт файл пользователю
     ├─ GET  /inventory/imports         ← список файлов, отправленных пользователем боту
     └─ GET  /inventory/imports/:fileId ← скачать конкретный файл

Telegram Bot (@ab_mini_test_bot)
     └─ bot.on('message:document')      ← пользователь шлёт боту XLSX/CSV
          └─ сохранить файл → БД
```

Поток **экспорта**:
1. Пользователь завершает ревизию → нажимает «Отправить в Telegram».
2. Фронт строит XLSX-файл и делает `POST /inventory/export` (multipart/form-data).
3. Сервер извлекает `userId` из `initData`, вызывает `bot.api.sendDocument(userId, ...)`.
4. Файл появляется в чате пользователя с ботом.

Поток **импорта**:
1. Пользователь шлёт боту XLSX/CSV-файл с номенклатурой.
2. Бот скачивает файл → сохраняет в `server/uploads/` → пишет запись в БД.
3. В Mini App пользователь выбирает «Из Telegram» → фронт делает `GET /inventory/imports`.
4. Пользователь выбирает файл → фронт делает `GET /inventory/imports/:fileId` → получает Blob → парсит.

---

## Авторизация: валидация initData

Все `/inventory/*` эндпоинты принимают заголовок `Authorization: tma <initData>`.
Сервер должен проверять подпись по `TELEGRAM_BOT_TOKEN`.

**`server/middleware/validateInitData.js`**

```javascript
const crypto = require('crypto')

/**
 * Middleware: проверяет Telegram initData и кладёт userId в req.telegramUserId.
 */
function validateInitData(req, res, next) {
  const authHeader = req.headers['authorization'] ?? ''

  if (authHeader.startsWith('tma ')) {
    const initData = authHeader.slice(4)
    const userId = verifyInitData(initData, process.env.TELEGRAM_BOT_TOKEN)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Неверная подпись initData' })
    }
    req.telegramUserId = String(userId)
    return next()
  }

  // Отладочный режим: X-Debug-User-Id (только если явно разрешён в env)
  if (process.env.ALLOW_DEBUG_AUTH === 'true') {
    const debugId = req.headers['x-debug-user-id']
    if (debugId) {
      req.telegramUserId = String(debugId)
      return next()
    }
  }

  return res.status(401).json({ success: false, error: 'Не передан заголовок Authorization' })
}

/**
 * Проверяет подпись Telegram initData (HMAC-SHA256).
 * @param {string} initDataRaw — строка initData из WebApp.initData
 * @param {string} botToken    — токен бота
 * @returns {number|null}      — userId если подпись верна, иначе null
 */
function verifyInitData(initDataRaw, botToken) {
  const params = new URLSearchParams(initDataRaw)
  const hash = params.get('hash')
  if (!hash) return null

  params.delete('hash')

  // Сортируем параметры по ключу и склеиваем через \n
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  // Ключ: HMAC-SHA256("WebAppData", botToken)
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest()

  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex')

  if (computedHash !== hash) return null

  try {
    const user = JSON.parse(params.get('user') ?? '{}')
    return user.id ?? null
  } catch {
    return null
  }
}

module.exports = { validateInitData, verifyInitData }
```

---

## Эндпоинт POST /inventory/export

**Принимает:** `multipart/form-data`
- `file` — XLSX-файл (Blob)
- `caption` — строка подписи (например `"Результаты ревизии: Склад №1"`)

**Авторизация:** `Authorization: tma <initData>` → `req.telegramUserId`

**Ответ:**
```json
{ "success": true, "data": { "messageId": 12345 } }
```

**`server/routes/inventory.js` (фрагмент)**

```javascript
const express = require('express')
const multer = require('multer')
const { Bot, InputFile } = require('grammy')
const { validateInitData } = require('../middleware/validateInitData')

const router = express.Router()
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

/**
 * POST /inventory/export
 * Отправляет XLSX-файл в чат пользователя через бота.
 */
router.post('/export', validateInitData, upload.single('file'), async (req, res) => {
  try {
    const { file } = req
    const caption = req.body.caption ?? ''

    if (!file) {
      return res.status(400).json({ success: false, error: 'Файл не передан' })
    }

    const message = await bot.api.sendDocument(
      req.telegramUserId,
      new InputFile(file.buffer, file.originalname),
      { caption },
    )

    res.json({ success: true, data: { messageId: message.message_id } })
  } catch (err) {
    console.error('[export]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})
```

---

## Эндпоинт GET /inventory/imports

**Авторизация:** `Authorization: tma <initData>`

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-or-file-id",
      "fileName": "nomenclature-2026-01.xlsx",
      "size": 25344,
      "uploadedAt": "2026-01-24T14:32:00.000Z",
      "productCount": 1247
    }
  ]
}
```

**Реализация:**

```javascript
/**
 * GET /inventory/imports
 * Список файлов, отправленных пользователем боту.
 */
router.get('/imports', validateInitData, async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT id, file_name, size, product_count, uploaded_at
         FROM telegram_imports
        WHERE user_id = $1
        ORDER BY uploaded_at DESC`,
      [req.telegramUserId],
    )

    const data = rows.map(r => ({
      id: r.id,
      fileName: r.file_name,
      size: r.size,
      uploadedAt: r.uploaded_at.toISOString(),
      productCount: r.product_count ?? undefined,
    }))

    res.json({ success: true, data })
  } catch (err) {
    console.error('[imports list]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})
```

---

## Эндпоинт GET /inventory/imports/:fileId

**Авторизация:** `Authorization: tma <initData>`

**Ответ:** бинарный поток файла (`Content-Type: application/octet-stream` или точный MIME).

**Реализация:**

```javascript
const path = require('path')
const fs = require('fs')

/**
 * GET /inventory/imports/:fileId
 * Возвращает содержимое файла.
 */
router.get('/imports/:fileId', validateInitData, async (req, res) => {
  try {
    const row = await db.queryOne(
      `SELECT file_path, file_name FROM telegram_imports
        WHERE id = $1 AND user_id = $2`,
      [req.params.fileId, req.telegramUserId],
    )

    if (!row) {
      return res.status(404).json({ success: false, error: 'Файл не найден' })
    }

    const absolutePath = path.resolve(row.file_path)
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, error: 'Файл отсутствует на диске' })
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(row.file_name)}"`)
    res.setHeader('Content-Type', 'application/octet-stream')
    fs.createReadStream(absolutePath).pipe(res)
  } catch (err) {
    console.error('[imports download]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
```

**Регистрация роутера в `server/index.js`:**

```javascript
const inventoryRouter = require('./routes/inventory')
app.use('/inventory', inventoryRouter)
```

---

## Хендлер бота: приём файлов от пользователя

```javascript
const { Bot } = require('grammy')
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')
const path = require('path')
const https = require('https')

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN)
const UPLOADS_DIR = path.resolve(__dirname, 'uploads')
fs.mkdirSync(UPLOADS_DIR, { recursive: true })

/**
 * Пользователь отправил боту документ (XLSX или CSV).
 */
bot.on('message:document', async (ctx) => {
  const doc = ctx.message.document
  const mime = doc.mime_type ?? ''
  const fileName = doc.file_name ?? 'import.xlsx'
  const ext = path.extname(fileName).toLowerCase()

  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'text/plain',
  ]
  const allowedExts = ['.xlsx', '.xls', '.csv', '.txt']

  if (!allowedMimes.includes(mime) && !allowedExts.includes(ext)) {
    await ctx.reply('⚠️ Поддерживаются только файлы XLSX и CSV.')
    return
  }

  const userId = String(ctx.from.id)
  const fileId = uuidv4()
  const filePath = path.join(UPLOADS_DIR, `${fileId}${ext}`)

  try {
    // Скачиваем файл через Telegram File API
    const file = await ctx.getFile()
    const downloadUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`

    await downloadFile(downloadUrl, filePath)

    const stats = fs.statSync(filePath)

    // Опционально: парсим количество товаров
    let productCount = null
    try {
      productCount = await countProducts(filePath, ext)
    } catch {
      // Игнорируем ошибку парсинга — productCount останется null
    }

    // Сохраняем метаданные в БД
    await db.query(
      `INSERT INTO telegram_imports (id, user_id, file_name, file_path, size, product_count, uploaded_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [fileId, userId, fileName, filePath, stats.size, productCount],
    )

    await ctx.reply(
      `✅ Файл <b>${fileName}</b> получен и доступен в Mini App.\n` +
      (productCount != null ? `📦 Обнаружено товаров: ${productCount}` : ''),
      { parse_mode: 'HTML' },
    )
  } catch (err) {
    console.error('[bot:document]', err)
    await ctx.reply('❌ Не удалось сохранить файл. Попробуйте позже.')
  }
})

/** Скачивает файл по URL на диск */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https.get(url, res => {
      res.pipe(file)
      file.on('finish', () => file.close(resolve))
    }).on('error', err => {
      fs.unlink(dest, () => {})
      reject(err)
    })
  })
}

/**
 * Подсчитывает количество строк данных в XLSX/CSV.
 * Используется только для информационного поля productCount.
 */
async function countProducts(filePath, ext) {
  if (ext === '.xlsx' || ext === '.xls') {
    const XLSX = require('xlsx')
    const wb = XLSX.readFile(filePath)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws)
    return rows.length
  }
  // CSV: считаем строки минус заголовок
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'))
  return Math.max(0, lines.length - 1)
}

bot.start()
```

---

## DDL миграции

```sql
CREATE TABLE IF NOT EXISTS telegram_imports (
  id            VARCHAR PRIMARY KEY,
  user_id       VARCHAR NOT NULL,
  file_name     VARCHAR NOT NULL,
  file_path     VARCHAR NOT NULL,
  size          INTEGER NOT NULL,
  product_count INTEGER,
  uploaded_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_imports_user ON telegram_imports(user_id);
```

---

## Apache: добавить проксирование /inventory

По аналогии с существующим блоком для `/bitrix` добавьте в VirtualHost для `minitest.bitrixabd.ru`:

```apache
# Telegram-bot inventory endpoints
ProxyPass        /inventory  http://127.0.0.1:9002/inventory
ProxyPassReverse /inventory  http://127.0.0.1:9002/inventory
```

Полный пример секции проксирования:

```apache
<VirtualHost *:443>
    ServerName minitest.bitrixabd.ru

    # ... SSL и другие настройки ...

    ProxyPass        /bitrix    http://127.0.0.1:9002/bitrix
    ProxyPassReverse /bitrix    http://127.0.0.1:9002/bitrix

    ProxyPass        /auth      http://127.0.0.1:9002/auth
    ProxyPassReverse /auth      http://127.0.0.1:9002/auth

    ProxyPass        /version   http://127.0.0.1:9002/version
    ProxyPassReverse /version   http://127.0.0.1:9002/version

    # Новый блок для инвентаризации / Telegram
    ProxyPass        /inventory http://127.0.0.1:9002/inventory
    ProxyPassReverse /inventory http://127.0.0.1:9002/inventory

    # Статика Mini App
    Alias /inventory/ /var/www/inventory/
    <Directory /var/www/inventory/>
        Options -Indexes
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

> **Важно:** порядок директив имеет значение. Блок `ProxyPass /inventory` должен идти
> **до** `Alias /inventory/`, иначе Apache будет отдавать статику вместо проксирования.
> Используйте более специфичные пути (например `/inventory/export`) для `ProxyPass`,
> чтобы избежать конфликта:
>
> ```apache
> ProxyPass /inventory/export   http://127.0.0.1:9002/inventory/export
> ProxyPass /inventory/imports  http://127.0.0.1:9002/inventory/imports
> ```

---

## Переменные окружения сервера

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCDefgh...   # токен бота
DATABASE_URL=postgres://user:pass@localhost/db
ALLOW_DEBUG_AUTH=false                       # true только в dev
```

---

## Контрольный список реализации

- [ ] Установить зависимости: `npm install grammy multer uuid xlsx papaparse`
- [ ] Создать `server/middleware/validateInitData.js` (скопировать из этого файла)
- [ ] Создать `server/routes/inventory.js` (POST /export, GET /imports, GET /imports/:fileId)
- [ ] Зарегистрировать роутер: `app.use('/inventory', require('./routes/inventory'))`
- [ ] Добавить хендлер `bot.on('message:document', ...)` в файл бота
- [ ] Выполнить SQL-миграцию
- [ ] Добавить ProxyPass в Apache-конфиг
- [ ] Проверить: `curl -X POST https://minitest.bitrixabd.ru/inventory/export -H "Authorization: tma ..." -F file=@test.xlsx`
