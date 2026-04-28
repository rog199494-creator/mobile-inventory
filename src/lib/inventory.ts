import * as XLSX from 'xlsx'
import type { InventorySession, VarianceItem, SessionSummary, ProductReference, ScanRecord } from './types'

export function calculateVariances(session: InventorySession): VarianceItem[] {
  const variances: VarianceItem[] = []
  const scannedBarcodes = new Map<string, number>()

  session.scans.forEach(scan => {
    const current = scannedBarcodes.get(scan.barcode) || 0
    scannedBarcodes.set(scan.barcode, current + scan.actualQty)
  })

  session.products.forEach(product => {
    const actualQty = scannedBarcodes.get(product.barcode) || 0
    const variance = actualQty - product.expectedQty
    const varianceValue = variance * product.price

    let varianceType: VarianceItem['varianceType']
    if (variance === 0) varianceType = 'match'
    else if (variance > 0) varianceType = 'surplus'
    else varianceType = 'shortage'

    variances.push({
      barcode: product.barcode,
      name: product.name,
      expectedQty: product.expectedQty,
      actualQty,
      variance,
      varianceValue,
      varianceType,
      price: product.price
    })

    scannedBarcodes.delete(product.barcode)
  })

  scannedBarcodes.forEach((actualQty, barcode) => {
    variances.push({
      barcode,
      name: 'Неизвестный товар',
      expectedQty: 0,
      actualQty,
      variance: actualQty,
      varianceValue: 0,
      varianceType: 'unknown',
      price: 0
    })
  })

  return variances
}

export function calculateSummary(variances: VarianceItem[]): SessionSummary {
  const summary: SessionSummary = {
    totalProducts: variances.length,
    scannedProducts: variances.filter(v => v.actualQty > 0).length,
    totalVariance: 0,
    totalVarianceValue: 0,
    shortageCount: 0,
    surplusCount: 0,
    unknownCount: 0,
    matchCount: 0
  }

  variances.forEach(v => {
    summary.totalVariance += Math.abs(v.variance)
    summary.totalVarianceValue += v.varianceValue

    if (v.varianceType === 'shortage') summary.shortageCount++
    else if (v.varianceType === 'surplus') summary.surplusCount++
    else if (v.varianceType === 'unknown') summary.unknownCount++
    else summary.matchCount++
  })

  return summary
}

export function parseExcelData(csvText: string): ProductReference[] {
  const lines = csvText.trim().split('\n')
  const products: ProductReference[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''))
    
    if (parts.length >= 3) {
      const barcode = parts[0]
      const name = parts[1]
      const expectedQty = parseFloat(parts[2]) || 0
      const price = parseFloat(parts[3]) || 0

      if (barcode && name) {
        products.push({ barcode, name, expectedQty, price })
      }
    }
  }

  return products
}

export function generateExcelCSV(variances: VarianceItem[]): string {
  const headers = ['Штрихкод', 'Название товара', 'План (шт)', 'Факт (шт)', 'Разница (шт)', 'Цена (₽)', 'Разница (₽)', 'Статус']
  const rows = variances.map(v => [
    v.barcode,
    v.name,
    v.expectedQty.toString(),
    v.actualQty.toString(),
    v.variance.toString(),
    v.price.toFixed(2),
    v.varianceValue.toFixed(2),
    v.varianceType === 'shortage' ? 'Недостача' :
    v.varianceType === 'surplus' ? 'Излишки' :
    v.varianceType === 'unknown' ? 'Неизвестно' : 'Совпадение'
  ])

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

export function downloadCSV(content: string, filename: string) {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

export function generateExcelFile(session: InventorySession, variances: VarianceItem[]): void {
  const filename = `Инвентаризация_${session.name}_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(buildExcelWorkbook(session, variances), filename)
}

/**
 * Builds the Excel workbook for a session without triggering a download.
 * Returns a Blob suitable for both local download and API upload.
 */
export function buildExcelBlob(session: InventorySession, variances: VarianceItem[]): Blob {
  const buffer = XLSX.write(buildExcelWorkbook(session, variances), { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/**
 * Builds a reusable XLSX Workbook object for the given session and variances.
 * Shared by `generateExcelFile` (triggers download) and `buildExcelBlob` (returns Blob).
 *
 * @param session  - The inventory session to summarise.
 * @param variances - Pre-calculated variance items for the session.
 * @returns An XLSX WorkBook with two sheets: «Сводка» and «Детали».
 */
function buildExcelWorkbook(session: InventorySession, variances: VarianceItem[]) {
  const summary = calculateSummary(variances)

  const summaryData = [
    ['Отчёт по инвентаризации'],
    [''],
    ['Название сессии:', session.name],
    ['Объект:', session.storeName ?? ''],
    ['Создана:', formatDate(session.createdAt)],
    ['Статус:', session.status === 'completed' ? 'Завершена' : session.status === 'active' ? 'Активна' : 'Запланирована'],
    ...(session.completedAt ? [['Завершена:', formatDate(session.completedAt)]] : []),
    [''],
    ['Итоги'],
    ['Всего товаров:', summary.totalProducts],
    ['Отсканировано:', summary.scannedProducts],
    ['Недостача:', summary.shortageCount],
    ['Излишки:', summary.surplusCount],
    ['Неизвестные:', summary.unknownCount],
    ['Совпадения:', summary.matchCount],
    [''],
  ]

  const detailsHeaders = ['Штрихкод', 'Название товара', 'План (шт)', 'Факт (шт)', 'Разница (шт)', 'Цена (₽)', 'Разница (₽)', 'Статус']
  const detailsData = variances.map(v => [
    v.barcode,
    v.name,
    v.expectedQty,
    v.actualQty,
    v.variance,
    v.price,
    v.varianceValue,
    v.varianceType === 'shortage' ? 'Недостача' :
    v.varianceType === 'surplus' ? 'Излишки' :
    v.varianceType === 'unknown' ? 'Неизвестно' : 'Совпадение'
  ])

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
  const ws2 = XLSX.utils.aoa_to_sheet([detailsHeaders, ...detailsData])

  ws1['!cols'] = [{ wch: 20 }, { wch: 30 }]
  ws2['!cols'] = [
    { wch: 15 },
    { wch: 40 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 }
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws1, 'Сводка')
  XLSX.utils.book_append_sheet(wb, ws2, 'Детали')

  return wb
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatCurrency(num: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(num)
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(timestamp)
}
