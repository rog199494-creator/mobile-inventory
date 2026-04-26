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
      name: 'Unknown Item',
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
  const headers = ['Barcode', 'Product Name', 'Expected Qty', 'Actual Qty', 'Variance', 'Price', 'Variance Value']
  const rows = variances.map(v => [
    v.barcode,
    v.name,
    v.expectedQty.toString(),
    v.actualQty.toString(),
    v.variance.toString(),
    v.price.toFixed(2),
    v.varianceValue.toFixed(2)
  ])

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
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
