// ─────────────────────────────────────────────────────────────────────────────
// API Envelope types
// Все ответы сервера приходят в формате { success, data } или { success, error }
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiEnvelope<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: string
}

export type ApiResponse<T> = ApiEnvelope<T> | ApiError

// ─────────────────────────────────────────────────────────────────────────────
// /bitrix/stores
// ─────────────────────────────────────────────────────────────────────────────

export interface Company {
  id: string
  name: string
}

export interface Store {
  id: string
  name: string
  address?: string
  companyId: string
}

export interface StoresResponse {
  companies: Company[]
  stores: Store[]
}

// ─────────────────────────────────────────────────────────────────────────────
// /bitrix/company/:companyId/finance
// ─────────────────────────────────────────────────────────────────────────────

export interface FinanceInvoice {
  id: string
  title: string
  description?: string
}

export interface FinancePeriod {
  /** Например "2026_3" */
  id: string
  /** Например "Март 2026" */
  month: string
  invoices: FinanceInvoice[]
}

export interface CompanyFinance {
  active: FinancePeriod[]
  upcoming: FinancePeriod[]
  archived: FinancePeriod[]
}

// ─────────────────────────────────────────────────────────────────────────────
// /bitrix/company/:companyId
// TODO: уточнить полную структуру у разработчика сервера
// ─────────────────────────────────────────────────────────────────────────────

export interface CompanyDetails {
  id: string
  name: string
  equipment?: unknown[]
  [k: string]: unknown
}

// ─────────────────────────────────────────────────────────────────────────────
// /bitrix/kassa/:kassaId
// TODO: уточнить структуру у разработчика сервера
// ─────────────────────────────────────────────────────────────────────────────

export interface KassaDetails {
  id: string
  [k: string]: unknown
}

// ─────────────────────────────────────────────────────────────────────────────
// /bitrix/calendar/:userId
// TODO: уточнить структуру у разработчика сервера
// ─────────────────────────────────────────────────────────────────────────────

export interface CalendarData {
  [k: string]: unknown
}

// ─────────────────────────────────────────────────────────────────────────────
// /bitrix/order/:orderId
// TODO: уточнить структуру у разработчика сервера
// ─────────────────────────────────────────────────────────────────────────────

export interface OrderDetails {
  id: string
  [k: string]: unknown
}

// ─────────────────────────────────────────────────────────────────────────────
// Системные эндпоинты
// ─────────────────────────────────────────────────────────────────────────────

export interface VersionResponse {
  version: string
}

export interface PingResponse {
  status: string
  message: string
  time: string
}

// ─────────────────────────────────────────────────────────────────────────────
// /inventory/imports — файлы номенклатуры, отправленные пользователем боту
// ─────────────────────────────────────────────────────────────────────────────

export interface TelegramImport {
  /** Уникальный id файла на сервере */
  id: string
  /** Оригинальное имя файла */
  fileName: string
  /** Размер в байтах */
  size: number
  /** ISO-строка даты загрузки */
  uploadedAt: string
  /** Количество товаров (если сервер заранее распарсил) */
  productCount?: number
}
