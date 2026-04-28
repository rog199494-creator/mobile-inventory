# Запуск как Telegram Mini App

Инструкция для разработчика клиента по настройке бота `@ab_mini_test_bot` и валидации запросов от нашего фронтенда.

---

## 1. Регистрация Mini App в BotFather

1. Открыть `@BotFather` в Telegram.
2. Выбрать бота `@ab_mini_test_bot` командой `/mybots`.
3. Нажать **Bot Settings → Menu Button → Configure menu button**.
4. Для создания нового Mini App: отправить команду `/newapp`.
5. Выбрать бота.
6. Указать **название** (например, `Объекты`).
7. Указать **URL** — публичный адрес задеплоенного приложения, например:
   ```
   https://<ваш-хостинг>/
   ```
8. При необходимости загрузить иконку (512×512 PNG).

После этого Mini App будет доступен по кнопке меню бота или через ссылку  
`https://t.me/ab_mini_test_bot/<short_name>`.

---

## 2. Что приходит с нашего фронтенда на сервер

При каждом запросе к API наш клиент подставляет заголовок:

```
Authorization: tma <initData>
```

где `initData` — строка, автоматически предоставляемая SDK Telegram Mini App (`window.Telegram.WebApp.initData`).

В режиме отладки (вне Telegram) вместо этого заголовка приходит:

```
X-Debug-User-Id: <значение VITE_DEBUG_USER_ID>
```

---

## 3. Валидация `initData` на сервере (Express)

Telegram требует HMAC-SHA256 проверку `initData` для защиты от подделки.

### Алгоритм (официальная документация Telegram)

1. Распарсить `initData` как `application/x-www-form-urlencoded`.
2. Извлечь значение `hash` и удалить его из набора параметров.
3. Отсортировать оставшиеся параметры по ключу в алфавитном порядке.
4. Собрать строку `data_check_string` — каждая пара `key=value` на новой строке.
5. Вычислить секретный ключ:
   ```
   secret_key = HMAC-SHA256("WebAppData", bot_token)
   ```
6. Вычислить ожидаемый хеш:
   ```
   expected_hash = HMAC-SHA256(data_check_string, secret_key)
   ```
7. Сравнить `expected_hash` с `hash` из `initData`.

**Ссылка:** https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

### Пример валидации на Node.js / Express

```javascript
const crypto = require('crypto')

function validateTelegramInitData(initData, botToken) {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return false
  params.delete('hash')

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest()

  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(expectedHash, 'hex'),
    Buffer.from(hash, 'hex'),
  )
}

// Middleware для Express
function telegramAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] ?? ''
  if (authHeader.startsWith('tma ')) {
    const initData = authHeader.slice(4)
    if (validateTelegramInitData(initData, process.env.BOT_TOKEN)) {
      return next()
    }
    return res.status(401).json({ success: false, error: 'Invalid Telegram initData' })
  }

  // Пропускать debug-запросы только в dev-режиме
  if (process.env.NODE_ENV !== 'production' && req.headers['x-debug-user-id']) {
    return next()
  }

  return res.status(401).json({ success: false, error: 'Unauthorized' })
}
```

---

## 4. Переменные окружения сервера

| Переменная | Описание |
|---|---|
| `BOT_TOKEN` | Токен бота `@ab_mini_test_bot` (из `@BotFather`) |
| `NODE_ENV` | `production` / `development` |

---

## 5. CORS

Для работы нашего SPA с сервером необходимо разрешить CORS-заголовки. В Express:

```javascript
const cors = require('cors')

app.use(cors({
  origin: ['https://<ваш-хостинг>', 'http://localhost:5173'],
  allowedHeaders: ['Authorization', 'X-Debug-User-Id', 'Content-Type'],
}))
```

В `dev`-режиме наш Vite-сервер проксирует запросы через `/api/*`, поэтому CORS для `localhost` не требуется.

---

## Дополнительные ресурсы

- [Telegram Mini Apps — официальная документация](https://core.telegram.org/bots/webapps)
- [Валидация initData](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app)
- [BotFather](https://t.me/BotFather)

---

## 6. Тема и цвета

### Как тема пробрасывается в приложение

Тема **всегда автоматическая** — никаких ручных переключателей нет.

При запуске внутри Telegram `initTelegram()` (вызывается в `src/main.tsx`) выполняет следующее:

1. Читает `tg.colorScheme` (`'light' | 'dark'`) и выставляет на `<html>`:
   - `data-theme="dark"` / `data-theme="light"` — для наших CSS-правил
   - `data-appearance="dark"` / `data-appearance="light"` — для Tailwind `dark:` utilities

2. Берёт `tg.themeParams` (HEX-цвета) и записывает их двумя способами:
   - CSS-переменные `--tg-*` (оригинальные HEX-значения, не трогать)
   - Прямое переопределение shadcn/Tailwind-токенов (`--background`, `--foreground`, `--primary` и т.д.) — CSS поддерживает HEX напрямую

3. Подписывается на `tg.onEvent('themeChanged', ...)` — при смене темы в Telegram (например, пользователь переключился с тёмной на светлую) все переменные обновляются автоматически.

При запуске вне Telegram:
- Читает системную тему через `window.matchMedia('(prefers-color-scheme: dark)')` и выставляет `data-theme` соответственно.
- Следит за изменениями системной темы (событие `change` на `MediaQueryList`).

### Fallback-значения

В `src/main.css` объявлены CSS-правила:

```css
:root          { /* светлые oklch-значения по умолчанию */ }
[data-theme="dark"] { /* тёмные oklch-значения по умолчанию */ }
```

Если Telegram не прислал `themeParams` (или приложение запущено в браузере без TG) — используются эти значения.

