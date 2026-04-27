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
} from '@/types/api'

// ─────────────────────────────────────────────────────────────────────────────
// Base URL
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.DEV
  ? '/bitrix'
  : (import.meta.env.VITE_API_BASE_URL ?? 'https://minitest.bitrixabd.ru/bitrix')

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

export { ApiRequestError }
