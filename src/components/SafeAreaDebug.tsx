import { useEffect, useState } from 'react'
import { tg, getSafeAreaFallback } from '@/services/telegram'

/**
 * Отладочный оверлей для диагностики safe-area значений.
 * Отображается только когда в URL присутствует `?debug=safe-area`.
 */
export function SafeAreaDebug() {
  const isDebug = new URLSearchParams(window.location.search).get('debug') === 'safe-area'
  const [data, setData] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isDebug) return

    const update = () => {
      const rootStyle = getComputedStyle(document.documentElement)
      setData({
        inTelegram: tg ? 'yes' : 'no',
        platform: String((tg as any)?.platform ?? 'n/a'),
        'contentSafeAreaInset.top': String((tg as any)?.contentSafeAreaInset?.top ?? 'n/a'),
        'safeAreaInset.top': String((tg as any)?.safeAreaInset?.top ?? 'n/a'),
        fallback: `${getSafeAreaFallback()}px`,
        'applied --safe-area-top': rootStyle.getPropertyValue('--safe-area-top').trim() || '(not set)',
        viewport: `${window.innerWidth}×${window.innerHeight}`,
      })
    }

    update()
    const timer = setInterval(update, 500)
    return () => clearInterval(timer)
  }, [isDebug])

  if (!isDebug) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.85)',
        color: '#0f0',
        padding: '6px 10px',
        fontFamily: 'monospace',
        fontSize: '11px',
        lineHeight: '1.6',
        pointerEvents: 'none',
      }}
    >
      {Object.entries(data).map(([k, v]) => (
        <div key={k}>
          <span style={{ color: '#aaa' }}>{k}: </span>
          <span style={{ color: '#0f0' }}>{v}</span>
        </div>
      ))}
    </div>
  )
}
