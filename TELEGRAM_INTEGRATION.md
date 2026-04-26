# Интеграция с другим Telegram Mini App для выбора магазина

## Описание

Приложение поддерживает интеграцию с внешним Telegram Mini App для выбора магазина при создании новой сессии инвентаризации. Это позволяет централизованно управлять списком магазинов в отдельном приложении.

## Как это работает

### 1. В приложении инвентаризации

При создании новой сессии инвентаризации пользователь может:
- Ввести название магазина вручную
- Выбрать магазин из другого мини-аппа Telegram (если приложение запущено в Telegram)

Для выбора магазина из мини-аппа:
1. Введите URL вашего мини-аппа для выбора магазинов (например: `https://t.me/your_store_bot/app`)
2. Нажмите кнопку "Выбрать магазин из приложения"
3. Откроется ваше мини-приложение для выбора магазина
4. После выбора магазина данные автоматически вернутся в приложение инвентаризации

### 2. В мини-аппе выбора магазинов

Ваше приложение для выбора магазинов должно отправить данные обратно используя следующий код:

```javascript
// Когда пользователь выбрал магазин
const selectedStore = {
  id: "store_123",           // Уникальный ID магазина
  name: "Центральный склад", // Название магазина
  address: "ул. Ленина, 1"   // Адрес (опционально)
}

// Отправка данных обратно в приложение инвентаризации
if (window.opener) {
  window.opener.postMessage({
    type: 'store_selected',
    store: selectedStore
  }, '*')
}

// Закрытие мини-аппа
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.close()
}
```

## Формат данных магазина

```typescript
interface StoreData {
  id: string          // Обязательно: уникальный идентификатор магазина
  name: string        // Обязательно: название магазина
  address?: string    // Опционально: адрес магазина
}
```

## Пример реализации мини-аппа для выбора магазинов

```html
<!DOCTYPE html>
<html>
<head>
  <title>Выбор магазина</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</head>
<body>
  <h1>Выберите магазин</h1>
  <div id="stores"></div>

  <script>
    // Инициализация Telegram WebApp
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // Список ваших магазинов
    const stores = [
      { id: "1", name: "Центральный склад", address: "ул. Ленина, 1" },
      { id: "2", name: "Магазин №1", address: "пр. Победы, 5" },
      { id: "3", name: "Магазин №2", address: "ул. Мира, 10" }
    ];

    // Отображение списка магазинов
    const container = document.getElementById('stores');
    stores.forEach(store => {
      const button = document.createElement('button');
      button.textContent = `${store.name} - ${store.address}`;
      button.onclick = () => selectStore(store);
      container.appendChild(button);
    });

    // Функция выбора магазина
    function selectStore(store) {
      // Отправка данных в приложение инвентаризации
      if (window.opener) {
        window.opener.postMessage({
          type: 'store_selected',
          store: store
        }, '*');
      }
      
      // Закрытие мини-аппа
      tg.close();
    }
  </script>
</body>
</html>
```

## Безопасность

- Приложение ожидает сообщения формата `{ type: 'store_selected', store: {...} }`
- Максимальное время ожидания ответа: 30 секунд
- URL мини-аппа сохраняется локально для удобства повторного использования

## Альтернативный способ: через startParam

Вы также можете передать данные магазина через параметр запуска:

```javascript
// Кодирование данных магазина в base64
const store = { id: "1", name: "Центральный склад" };
const startParam = btoa(JSON.stringify(store));

// Ссылка для запуска приложения с выбранным магазином
const link = `https://t.me/your_inventory_bot/app?startapp=${startParam}`;
```

Приложение автоматически распознает и применит данные магазина при запуске.

## Отладка

Для проверки работы интеграции вне Telegram используйте:

```javascript
// Проверка, запущено ли приложение в Telegram
import { isTelegramWebApp } from '@/lib/telegram'

if (isTelegramWebApp()) {
  console.log('Приложение запущено в Telegram')
} else {
  console.log('Приложение запущено в браузере')
}
```

При запуске вне Telegram функция выбора магазина из мини-аппа будет скрыта, и пользователь сможет только ввести название вручную.
