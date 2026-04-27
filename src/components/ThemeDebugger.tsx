/**
 * ThemeDebugger — плавающая панель для переключения тем в режиме разработки.
 * В production-сборке компонент не рендерится (import.meta.env.DEV === false).
 */
import { applyMockTelegramTheme, applyTelegramTheme, clearTgThemeVars } from '@/services/telegram'

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '1rem',
  right: '1rem',
  zIndex: 9999,
  display: 'flex',
  gap: '0.25rem',
  background: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(4px)',
  borderRadius: '0.5rem',
  padding: '0.375rem',
  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
}

const btnBase: React.CSSProperties = {
  padding: '0.25rem 0.625rem',
  borderRadius: '0.25rem',
  fontSize: '0.7rem',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  lineHeight: 1.4,
  letterSpacing: '0.02em',
  transition: 'opacity 0.15s',
}

function setLight() {
  clearTgThemeVars()
  document.documentElement.dataset.theme = 'light'
  document.documentElement.dataset.appearance = 'light'
}

function setDark() {
  clearTgThemeVars()
  document.documentElement.dataset.theme = 'dark'
  document.documentElement.dataset.appearance = 'dark'
}

function setTelegram() {
  const systemScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  applyTelegramTheme()
  // Если вне Telegram — явно применить мок для наглядности
  if (!window.Telegram?.WebApp) {
    applyMockTelegramTheme(systemScheme)
  }
}

export function ThemeDebugger() {
  if (!import.meta.env.DEV) return null

  return (
    <div style={panelStyle} title="Theme debugger (dev only)">
      <button
        style={{ ...btnBase, background: '#f5f5f5', color: '#111' }}
        onClick={setLight}
      >
        Light
      </button>
      <button
        style={{ ...btnBase, background: '#1a2332', color: '#f5f5f5' }}
        onClick={setDark}
      >
        Dark
      </button>
      <button
        style={{ ...btnBase, background: '#2481cc', color: '#fff' }}
        onClick={setTelegram}
      >
        Telegram
      </button>
    </div>
  )
}
