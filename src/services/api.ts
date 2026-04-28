/**
 * API-клиент для сервера клиента (minitest.bitrixabd.ru).
 *
 * - В dev-режиме запросы идут через Vite-прокси (/bitrix → minitest.bitrixabd.ru/bitrix)
 * - В продакшене используется VITE_API_BASE_URL
 * - Авторизация: если запущено в Telegram — заголовок `Authorization: tma <initData>`,
 *   иначе — `X-Debug-User-Id` из VITE_DEBUG_USER_ID
 */

import type {
  ApiResponse,
  StoresResponse,
  CompanyDetails,
  CompanyFinance,
  KassaDetails,
  CalendarData,
  OrderDetails,
  VersionResponse,
  PingResponse,
  TelegramImport,
} from '@/types/api'

// ─────────────────────────────────────────────────────────────────────────────
// Base URLs
// ─────────────────────────────────────────────────────────────────────────────

/** Bitrix API base (all /bitrix/... endpoints) */
const BASE_URL = import.meta.env.DEV
  ? '/bitrix'
  : (import.meta.env.VITE_API_BASE_URL ?? 'https://minitest.bitrixabd.ru/bitrix')

/**
 * Server root for /inventory/... endpoints.
 * In dev mode we use the Vite proxy prefix /inventory.
 * In production we strip the trailing /bitrix segment from BASE_URL
 * (or use an explicit VITE_SERVER_BASE_URL env var).
 * Falls back to BASE_URL as-is if it doesn't end with /bitrix.
 */
const SERVER_BASE_URL: string = import.meta.env.DEV
  ? '/inventory'
  : (import.meta.env.VITE_SERVER_BASE_URL as string | undefined)
    ?? (BASE_URL.match(/\/bitrix\/?$/)
        ? BASE_URL.replace(/\/bitrix\/?$/, '')
        : BASE_URL)

// ─────────────────────────────────────────────────────────────────────────────
// Auth headers
// ─────────────────────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const tg = window.Telegram?.WebApp
  const initData = tg?.initData

  if (initData) {
    return { Authorization: `tma ${initData}` }
  }

  // Запущено вне Telegram (браузер / разработка)
  console.warn(
    '[api] Telegram initData не найден — запрос идёт без авторизации Telegram. ' +
    'Используется X-Debug-User-Id.',
  )
  const debugUserId = import.meta.env.VITE_DEBUG_USER_ID ?? ''
  return debugUserId ? { 'X-Debug-User-Id': debugUserId } : {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Core fetch wrapper
// ─────────────────────────────────────────────────────────────────────────────

class ApiRequestError extends Error {
  constructor(
    public readonly serverMessage: string,
    public readonly status?: number,
  ) {
    super(serverMessage)
    this.name = 'ApiRequestError'
  }
}

async function request<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`

  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    })
  } catch (networkError) {
    throw new ApiRequestError(
      `Сетевая ошибка при запросе ${url}: ${(networkError as Error).message}`,
    )
  }

  if (!response.ok) {
    throw new ApiRequestError(
      `Сервер вернул ошибку ${response.status} для ${url}`,
      response.status,
    )
  }

  let json: ApiResponse<T>
  try {
    json = (await response.json()) as ApiResponse<T>
  } catch {
    throw new ApiRequestError(`Не удалось разобрать JSON-ответ от ${url}`)
  }

  if (!json.success) {
    throw new ApiRequestError(json.error || 'Неизвестная ошибка сервера')
  }

  return json.data
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export const api = {
  /** GET /bitrix/stores — список компаний и объектов */
  getStores: (): Promise<StoresResponse> => request<StoresResponse>('/stores'),

  /** GET /bitrix/company/:companyId — детали компании */
  getCompany: (companyId: string): Promise<CompanyDetails> =>
    request<CompanyDetails>(`/company/${companyId}`),

  /** GET /bitrix/company/:companyId/finance — финансы компании */
  getCompanyFinance: (companyId: string): Promise<CompanyFinance> =>
    request<CompanyFinance>(`/company/${companyId}/finance`),

  /** GET /bitrix/kassa/:kassaId — информация по кассе/ККТ */
  getKassa: (kassaId: string): Promise<KassaDetails> =>
    request<KassaDetails>(`/kassa/${kassaId}`),

  /** GET /bitrix/calendar/:userId — календарь обслуживания */
  getCalendar: (userId: string): Promise<CalendarData> =>
    request<CalendarData>(`/calendar/${userId}`),

  /** GET /bitrix/order/:orderId — детали заказа/счёта */
  getOrder: (orderId: string): Promise<OrderDetails> =>
    request<OrderDetails>(`/order/${orderId}`),

  /** GET /bitrix/version — версия сервера */
  getVersion: (): Promise<VersionResponse> => request<VersionResponse>('/version'),

  /** GET /bitrix/ — health-check */
  ping: (): Promise<PingResponse> => request<PingResponse>('/'),
}

// ─────────────────────────────────────────────────────────────────────────────
// Inventory / Telegram API
// Эндпоинты на /inventory/... (не под /bitrix, отдельный префикс на сервере)
// ─────────────────────────────────────────────────────────────────────────────

export const inventoryApi = {
  /**
   * POST /inventory/export
   * Отправляет XLSX-файл с результатами ревизии в чат пользователя через бота.
   */
  exportToTelegram: async (sessionName: string, xlsxBlob: Blob): Promise<{ messageId: number }> => {
    const formData = new FormData()
    formData.append('file', xlsxBlob, `${sessionName}.xlsx`)
    formData.append('caption', `Результаты ревизии: ${sessionName}`)

    const url = `${SERVER_BASE_URL}/inventory/export`
    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        // Content-Type выставляет сам fetch для FormData
        headers: { ...getAuthHeaders() },
        body: formData,
      })
    } catch (networkError) {
      throw new ApiRequestError(
        `Сетевая ошибка при запросе ${url}: ${(networkError as Error).message}`,
      )
    }

    if (!response.ok) {
      throw new ApiRequestError(`Сервер вернул ${response.status}`, response.status)
    }

    let json: { success: boolean; data?: { messageId: number }; error?: string }
    try {
      json = await response.json()
    } catch {
      throw new ApiRequestError('Не удалось разобрать JSON-ответ от сервера')
    }

    if (!json.success) {
      throw new ApiRequestError(json.error ?? 'Ошибка отправки в Telegram')
    }

    return json.data as { messageId: number }
  },

  /**
   * GET /inventory/imports
   * Возвращает список XLSX/CSV-файлов, ранее отправленных пользователем боту.
   */
  listImports: async (): Promise<TelegramImport[]> => {
    const url = `${SERVER_BASE_URL}/inventory/imports`
    let response: Response
    try {
      response = await fetch(url, {
        headers: { Accept: 'application/json', ...getAuthHeaders() },
      })
    } catch (networkError) {
      throw new ApiRequestError(
        `Сетевая ошибка при запросе ${url}: ${(networkError as Error).message}`,
      )
    }

    if (!response.ok) {
      throw new ApiRequestError(`Сервер вернул ${response.status}`, response.status)
    }

    let json: { success: boolean; data?: TelegramImport[]; error?: string }
    try {
      json = await response.json()
    } catch {
      throw new ApiRequestError('Не удалось разобрать JSON-ответ от сервера')
    }

    if (!json.success) {
      throw new ApiRequestError(json.error ?? 'Ошибка получения списка файлов')
    }

    return json.data ?? []
  },

  /**
   * GET /inventory/imports/:fileId
   * Скачивает содержимое файла (сервер отдаёт как stream).
   */
  downloadImport: async (fileId: string): Promise<Blob> => {
    const url = `${SERVER_BASE_URL}/inventory/imports/${fileId}`
    let response: Response
    try {
      response = await fetch(url, { headers: getAuthHeaders() })
    } catch (networkError) {
      throw new ApiRequestError(
        `Сетевая ошибка при запросе ${url}: ${(networkError as Error).message}`,
      )
    }

    if (!response.ok) {
      throw new ApiRequestError(`Сервер вернул ${response.status}`, response.status)
    }

    return await response.blob()
  },
}

export { ApiRequestError }
