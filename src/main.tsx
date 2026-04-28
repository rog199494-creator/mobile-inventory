import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { initTelegram, applySafeArea } from './services/telegram.ts'

import "./main.css"

initTelegram()
applySafeArea()

// Watchdog: повторно применяем safe-area через 1с,
// т.к. Telegram иногда отдаёт insets с задержкой
setTimeout(() => applySafeArea(), 1000)

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)
