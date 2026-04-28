/**
 * Отладочный оверлей safe-area — показывается только при ?debug=safe-area в URL.
 * Позволяет увидеть реальные значения Telegram insets прямо в Mini App.
 *
 * Использование: откройте https://<host>/?debug=safe-area в Telegram.
 */

import { useState, useEffect } from 'react'
import { tg } from '@/services/telegram'

function getDebugInfo() {
  const safeAreaTop = getComputedStyle(document.documentElement)
    .getPropertyValue('--safe-area-top')
    .trim()

  return {
    isTelegram: !!tg && tg.initData !== '',
    platform: tg?.platform ?? 'n/a',
    contentSafeAreaTop: tg?.contentSafeAreaInset?.top ?? 'undefined',
    safeAreaTop: tg?.safeAreaInset?.top ?? 'undefined',
    viewportHeight: tg?.viewportHeight ?? 'undefined',
    viewportStableHeight: tg?.viewportStableHeight ?? 'undefined',
    appliedSafeAreaTop: safeAreaTop || '0px (not set)',
  }
}

export function SafeAreaDebug() {
  const [info, setInfo] = useState(getDebugInfo)

  useEffect(() => {
    const refresh = () => setInfo(getDebugInfo())

    tg?.onEvent?.('viewportChanged', refresh)
    tg?.onEvent?.('safeAreaChanged', refresh)
    tg?.onEvent?.('contentSafeAreaChanged', refresh)

    // Also refresh once after a short delay in case values arrive asynchronously
    const timer = setTimeout(refresh, 500)

    return () => {
      tg?.offEvent?.('viewportChanged', refresh)
      tg?.offEvent?.('safeAreaChanged', refresh)
      tg?.offEvent?.('contentSafeAreaChanged', refresh)
      clearTimeout(timer)
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 60,
        left: 8,
        right: 8,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: 11,
        padding: '8px 10px',
        borderRadius: 8,
        lineHeight: 1.6,
        pointerEvents: 'none',
      }}
    >
      <div style={{ color: '#ff0', fontWeight: 'bold', marginBottom: 4 }}>
        🔍 safe-area debug
      </div>
      <div>TG: {info.isTelegram ? 'yes' : 'no'} ({info.platform})</div>
      <div>contentSafeAreaInset.top: {String(info.contentSafeAreaTop)}</div>
      <div>safeAreaInset.top: {String(info.safeAreaTop)}</div>
      <div>viewportHeight: {String(info.viewportHeight)}</div>
      <div>viewportStableHeight: {String(info.viewportStableHeight)}</div>
      <div style={{ color: '#0ff', fontWeight: 'bold' }}>
        applied --safe-area-top: {info.appliedSafeAreaTop}
      </div>
    </div>
  )
}
