/**
 * Сервис-обёртка над Telegram WebApp SDK.
 *
 * Graceful fallback: если приложение запущено вне Telegram (браузер),
 * все функции корректно возвращают undefined/false, не бросают ошибок.
 */

export const tg = window.Telegram?.WebApp

// ─────────────────────────────────────────────────────────────────────────────
// Тема: CSS-переменные и data-theme / data-appearance
// ─────────────────────────────────────────────────────────────────────────────

/** CSS-переменные Telegram, выставляемые сервисом */
const TG_CSS_VARS = [
  '--tg-bg-color',
  '--tg-text-color',
  '--tg-button-color',
  '--tg-button-text-color',
  '--tg-hint-color',
  '--tg-link-color',
  '--tg-secondary-bg-color',
  '--tg-accent-text-color',
  '--tg-section-separator-color',
] as const

/** shadcn/Tailwind-токены, переопределяемые при Telegram-теме */
const THEME_OVERRIDE_VARS = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--border',
  '--input',
  '--ring',
] as const

type TgColors = {
  bg_color?: string
  text_color?: string
  secondary_bg_color?: string
  button_color?: string
  button_text_color?: string
  hint_color?: string
  link_color?: string
  accent_text_color?: string
  section_separator_color?: string
}

/** Применяет переменные --tg-* и соответствующие shadcn-токены */
function applyTgVars(params: TgColors): void {
  const root = document.documentElement
  const set = (name: string, value?: string) => {
    if (value) root.style.setProperty(name, value)
  }

  // --tg-* переменные (HEX)
  set('--tg-bg-color', params.bg_color)
  set('--tg-text-color', params.text_color)
  set('--tg-button-color', params.button_color)
  set('--tg-button-text-color', params.button_text_color)
  set('--tg-hint-color', params.hint_color)
  set('--tg-link-color', params.link_color)
  set('--tg-secondary-bg-color', params.secondary_bg_color)
  set('--tg-accent-text-color', params.accent_text_color)
  set('--tg-section-separator-color', params.section_separator_color)

  // Переопределить shadcn-токены (CSS поддерживает HEX напрямую)
  set('--background', params.bg_color)
  set('--foreground', params.text_color)

  const cardBg = params.secondary_bg_color ?? params.bg_color
  set('--card', cardBg)
  set('--card-foreground', params.text_color)
  set('--popover', cardBg)
  set('--popover-foreground', params.text_color)
  set('--secondary', cardBg)
  set('--secondary-foreground', params.hint_color ?? params.text_color)
  set('--muted', cardBg)
  set('--muted-foreground', params.hint_color)

  set('--primary', params.button_color)
  set('--primary-foreground', params.button_text_color)

  const accentColor = params.accent_text_color ?? params.link_color ?? params.button_color
  set('--accent', accentColor)
  set('--accent-foreground', params.button_text_color)

  set('--border', params.section_separator_color ?? params.secondary_bg_color)
  set('--input', params.secondary_bg_color)
  set('--ring', params.button_color)
}

/** Выставляет data-theme и data-appearance на <html> */
function setThemeAttributes(scheme: 'light' | 'dark'): void {
  document.documentElement.dataset.theme = scheme
  document.documentElement.dataset.appearance = scheme
}

/** Очищает все inline CSS-переменные темы Telegram и shadcn-переопределений */
export function clearTgThemeVars(): void {
  const root = document.documentElement
  TG_CSS_VARS.forEach(v => root.style.removeProperty(v))
  THEME_OVERRIDE_VARS.forEach(v => root.style.removeProperty(v))
}

/**
 * Применяет тему из реального tg.themeParams (если в Telegram)
 * или системную тему (если вне Telegram).
 */
export function applyTelegramTheme(): void {
  if (tg) {
    const scheme = tg.colorScheme ?? 'light'
    setThemeAttributes(scheme)
    if (tg.themeParams) {
      applyTgVars(tg.themeParams)
    }
  } else {
    const systemScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    setThemeAttributes(systemScheme)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Safe-area: компенсация статус-бара и шапки Telegram
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Вычисляет и устанавливает CSS-переменную `--safe-area-top` на `<html>`.
 *
 * Используются два источника:
 * 1. `tg.safeAreaInset.top` — высота системного статус-бара.
 * 2. `tg.contentSafeAreaInset.top` — высота Telegram-хрома (кнопки «Закрыть» и т.п.).
 * Берётся сумма обоих. Если Telegram-клиент не отдаёт insets (старые версии),
 * применяется платформенный fallback, чтобы контент не «наехал» на статус-бар.
 */
export function applySafeArea(): void {
  const tgContentTop = tg?.contentSafeAreaInset?.top ?? 0
  const tgSafeTop = tg?.safeAreaInset?.top ?? 0
  const tgTotal = tgContentTop + tgSafeTop

  const isTelegram = !!tg && tg.initData !== ''

  // Платформенный fallback: когда старый клиент не отдаёт insets, используем
  // разумные минимальные значения, чтобы контент был ниже Telegram-хрома.
  const fallback = (() => {
    if (!isTelegram) return 0
    const platform = tg?.platform
    if (platform === 'web' || platform === 'tdesktop') return 56   // только TG header
    if (platform === 'ios') return 100                              // статус-бар + TG header
    if (platform === 'android') return 80
    return 100                                                      // неизвестная платформа
  })()

  const finalTop = Math.max(tgTotal, fallback)
  document.documentElement.style.setProperty('--safe-area-top', `${finalTop}px`)
}

/**
 * Инициализирует Telegram WebApp:
 * - сообщает платформе, что приложение готово (`ready()`)
 * - разворачивает на весь экран (`expand()`)
 * - применяет системную тему через `tg.colorScheme` (в Telegram) или `prefers-color-scheme` (вне Telegram)
 * - подписывается на событие смены темы
 * - вычисляет и обновляет safe-area-top при изменении viewport/insets
 */
export function initTelegram(): void {
  if (tg) {
    tg.ready()
    tg.expand()

    const applyCurrentTheme = () => {
      const scheme = tg.colorScheme ?? 'light'
      setThemeAttributes(scheme)
      if (tg.themeParams) {
        applyTgVars(tg.themeParams)
      }
    }

    applyCurrentTheme()
    tg.onEvent('themeChanged', applyCurrentTheme)

    // Применяем safe-area сразу и подписываемся на события изменения
    applySafeArea()
    tg.onEvent('viewportChanged', applySafeArea)
    tg.onEvent('safeAreaChanged', applySafeArea)
    tg.onEvent('contentSafeAreaChanged', applySafeArea)
  } else {
    // Вне Telegram — системная тема, safe-area-top = 0
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setThemeAttributes(mq.matches ? 'dark' : 'light')

    mq.addEventListener('change', e => {
      setThemeAttributes(e.matches ? 'dark' : 'light')
    })
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
