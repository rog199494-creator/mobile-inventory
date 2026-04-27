/**
 * Сервис-обёртка над Telegram WebApp SDK.
 *
 * Graceful fallback: если приложение запущено вне Telegram (браузер),
 * все функции корректно возвращают undefined/false, не бросают ошибок.
 */

export const tg = window.Telegram?.WebApp

/**
 * Инициализирует Telegram WebApp:
 * - сообщает платформе, что приложение готово (`ready()`)
 * - разворачивает на весь экран (`expand()`)
 * - применяет цвета темы к CSS-переменным
 */
export function initTelegram(): void {
  if (!tg) return

  tg.ready()
  tg.expand()

  const { themeParams } = tg
  if (themeParams) {
    const root = document.documentElement
    if (themeParams.bg_color) root.style.setProperty('--tg-bg-color', themeParams.bg_color)
    if (themeParams.text_color) root.style.setProperty('--tg-text-color', themeParams.text_color)
    if (themeParams.button_color) root.style.setProperty('--tg-button-color', themeParams.button_color)
    if (themeParams.button_text_color) root.style.setProperty('--tg-button-text-color', themeParams.button_text_color)
  }
}

/** Возвращает объект пользователя Telegram или undefined если не в Telegram. */
export function getTelegramUser() {
  return tg?.initDataUnsafe?.user
}

/** Возвращает true, если приложение запущено внутри Telegram. */
export function isInsideTelegram(): boolean {
  return !!tg && tg.initData !== ''
}

// ─────────────────────────────────────────────────────────────────────────────
// MainButton helpers
// ─────────────────────────────────────────────────────────────────────────────

export function showMainButton(text: string, onClick: () => void): void {
  if (!tg) return
  tg.MainButton.setText(text)
  tg.MainButton.onClick(onClick)
  tg.MainButton.show()
}

export function hideMainButton(onClick?: () => void): void {
  if (!tg) return
  if (onClick) tg.MainButton.offClick(onClick)
  tg.MainButton.hide()
}

// ─────────────────────────────────────────────────────────────────────────────
// BackButton helpers
// ─────────────────────────────────────────────────────────────────────────────

export function showBackButton(onClick: () => void): void {
  if (!tg?.BackButton) return
  tg.BackButton.onClick(onClick)
  tg.BackButton.show()
}

export function hideBackButton(onClick?: () => void): void {
  if (!tg?.BackButton) return
  if (onClick) tg.BackButton.offClick(onClick)
  tg.BackButton.hide()
}
