import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export interface OneCProduct {
  sku: string
  barcode?: string
  name: string
  unit?: string
  expectedQty: number
  price?: number
}

export interface RevisionResultRow {
  sku: string
  barcode?: string
  name: string
  unit?: string
  expectedQty: number
  actualQty: number
  diff: number
  comment?: string
}

// ────────────────────────────────────────────────────────────
// Column-name synonyms (Russian 1C names + English fallbacks)
// ────────────────────────────────────────────────────────────
const COL_SKU = ['Артикул', 'артикул', 'SKU', 'sku', 'Код', 'код', 'Code', 'code', 'Артикул товара']
const COL_BARCODE = ['Штрихкод', 'штрихкод', 'ШтрихКод', 'Barcode', 'barcode', 'EAN', 'ean', 'Штрих-код']
const COL_NAME = [
  'Наименование', 'наименование', 'Название', 'название',
  'Name', 'name', 'Product Name', 'Товар', 'товар',
  'НаименованиеТовара', 'Наименование товара',
]
const COL_UNIT = [
  'ЕдиницаИзмерения', 'Единица измерения', 'Единица', 'единица',
  'Unit', 'unit', 'ЕИ', 'ед.изм.',
]
const COL_QTY = [
  'Остаток', 'остаток', 'КоличествоОстатков', 'Количество',
  'Expected Qty', 'qty', 'Qty', 'quantity', 'Quantity',
  'stock', 'Stock', 'Остатки', 'ОстатокПоДанным1С',
]
const COL_PRICE = ['Цена', 'цена', 'Price', 'price', 'Стоимость', 'стоимость']
const COL_WAREHOUSE = ['Склад', 'склад', 'Warehouse', 'warehouse', 'НазваниеСклада']

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/** Find the actual header name in a row that matches any of the synonyms. */
function findCol(headers: string[], synonyms: string[]): string | undefined {
  return headers.find(h => synonyms.includes(h.trim()))
}

/** Convert a raw record (object with string values) to OneCProduct. Returns null + reason on failure. */
function recordToProduct(
  row: Record<string, string>,
  headers: string[],
  rowIndex: number,
): { product: OneCProduct | null; error: string | null } {
  const skuCol = findCol(headers, COL_SKU)
  const barcodeCol = findCol(headers, COL_BARCODE)
  const nameCol = findCol(headers, COL_NAME)
  const unitCol = findCol(headers, COL_UNIT)
  const qtyCol = findCol(headers, COL_QTY)
  const priceCol = findCol(headers, COL_PRICE)

  const rawBarcode = barcodeCol ? (row[barcodeCol] ?? '').trim() : ''
  const rawSku = skuCol ? (row[skuCol] ?? '').trim() : rawBarcode
  const rawName = nameCol ? (row[nameCol] ?? '').trim() : ''
  const rawQty = qtyCol ? (row[qtyCol] ?? '').trim() : ''

  if (!rawSku && !rawBarcode) {
    return { product: null, error: `Строка ${rowIndex}: отсутствует Артикул и Штрихкод` }
  }
  if (!rawName) {
    return { product: null, error: `Строка ${rowIndex}: отсутствует Наименование` }
  }

  const parsedQty = rawQty ? parseFloat(rawQty.replace(',', '.')) : 0
  if (rawQty && isNaN(parsedQty)) {
    return { product: null, error: `Строка ${rowIndex}: некорректное значение Остатка: "${rawQty}"` }
  }

  const rawPrice = priceCol ? (row[priceCol] ?? '').trim() : ''
  const price = rawPrice ? parseFloat(rawPrice.replace(',', '.')) : undefined

  const rawUnit = unitCol ? (row[unitCol] ?? '').trim() : undefined

  return {
    product: {
      sku: rawSku || rawBarcode,
      barcode: rawBarcode || undefined,
      name: rawName,
      unit: rawUnit || undefined,
      expectedQty: parsedQty,
      price: price !== undefined && !isNaN(price) ? price : undefined,
    },
    error: null,
  }
}

// ────────────────────────────────────────────────────────────
// Import
// ────────────────────────────────────────────────────────────

export async function importFromFile(file: File): Promise<{
  products: OneCProduct[]
  warehouse?: string
  errors: string[]
}> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'xlsx' || ext === 'xls') {
    return importFromXLSX(file)
  }
  return importFromCSV(file)
}

async function importFromCSV(file: File): Promise<{
  products: OneCProduct[]
  warehouse?: string
  errors: string[]
}> {
  const arrayBuffer = await file.arrayBuffer()
  // Strip UTF-8 BOM if present
  let text = new TextDecoder('utf-8').decode(arrayBuffer)
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1)
  }

  // Skip comment lines (lines starting with #) before parsing
  const lines = text.split('\n')
  const commentLines = lines.filter(l => l.trimStart().startsWith('#'))
  const dataLines = lines.filter(l => !l.trimStart().startsWith('#'))
  const cleanText = dataLines.join('\n')

  // Extract warehouse from comment lines if present
  let warehouseFromComment: string | undefined
  for (const cl of commentLines) {
    const m = cl.match(/Склад\s*:\s*(.+)/i)
    if (m) {
      warehouseFromComment = m[1].trim()
      break
    }
  }

  const result = Papa.parse<Record<string, string>>(cleanText, {
    header: true,
    skipEmptyLines: true,
    delimiter: '',
    dynamicTyping: false,
  })

  const headers = result.meta.fields ?? []
  const products: OneCProduct[] = []
  const errors: string[] = result.errors.map(e => `Ошибка парсинга CSV: ${e.message}`)

  const warehouseCol = findCol(headers, COL_WAREHOUSE)
  let warehouse: string | undefined = warehouseFromComment

  result.data.forEach((row, idx) => {
    if (warehouseCol && !warehouse) {
      const w = (row[warehouseCol] ?? '').trim()
      if (w) warehouse = w
    }

    const { product, error } = recordToProduct(row, headers, idx + 2)
    if (error) {
      errors.push(error)
    } else if (product) {
      products.push(product)
    }
  })

  return { products, warehouse, errors }
}

async function importFromXLSX(file: File): Promise<{
  products: OneCProduct[]
  warehouse?: string
  errors: string[]
}> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return { products: [], errors: ['Файл не содержит листов'] }
  }

  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  if (rows.length === 0) {
    return { products: [], errors: ['Файл пустой или не содержит данных'] }
  }

  // Convert all values to strings for uniform processing
  const stringRows = rows.map(r =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? '')])),
  ) as Record<string, string>[]

  const headers = Object.keys(stringRows[0] ?? {})
  const products: OneCProduct[] = []
  const errors: string[] = []

  const warehouseCol = findCol(headers, COL_WAREHOUSE)
  let warehouse: string | undefined

  stringRows.forEach((row, idx) => {
    if (warehouseCol && !warehouse) {
      const w = (row[warehouseCol] ?? '').trim()
      if (w) warehouse = w
    }

    const { product, error } = recordToProduct(row, headers, idx + 2)
    if (error) {
      errors.push(error)
    } else if (product) {
      products.push(product)
    }
  })

  return { products, warehouse, errors }
}

// ────────────────────────────────────────────────────────────
// Export — CSV (UTF-8 BOM, semicolon, Russian headers)
// ────────────────────────────────────────────────────────────

const EXPORT_HEADERS_CSV = [
  'Артикул',
  'Штрихкод',
  'Наименование',
  'ЕдиницаИзмерения',
  'ОстатокПоДанным1С',
  'ФактическоеКоличество',
  'Расхождение',
  'Комментарий',
]

function escapeCSV(value: string | number | undefined): string {
  const s = String(value ?? '')
  if (s.includes(';') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function exportToCSV(
  rows: RevisionResultRow[],
  meta: { warehouse?: string; date: Date },
): Blob {
  const lines: string[] = []

  if (meta.warehouse) {
    lines.push(`# Склад: ${meta.warehouse}`)
  }
  lines.push(`# Дата ревизии: ${meta.date.toISOString().split('T')[0]}`)
  lines.push(EXPORT_HEADERS_CSV.join(';'))

  for (const row of rows) {
    lines.push(
      [
        escapeCSV(row.sku),
        escapeCSV(row.barcode),
        escapeCSV(row.name),
        escapeCSV(row.unit),
        escapeCSV(row.expectedQty),
        escapeCSV(row.actualQty),
        escapeCSV(row.diff),
        escapeCSV(row.comment),
      ].join(';'),
    )
  }

  const BOM = '\uFEFF'
  return new Blob([BOM + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
}

// ────────────────────────────────────────────────────────────
// Export — XLSX
// ────────────────────────────────────────────────────────────

const EXPORT_HEADERS_XLSX = [
  'Артикул',
  'Штрихкод',
  'Наименование',
  'Ед. изм.',
  'Остаток по 1С',
  'Факт',
  'Расхождение',
  'Комментарий',
]

export function exportToXLSX(
  rows: RevisionResultRow[],
  meta: { warehouse?: string; date: Date },
): Blob {
  const dateStr = meta.date.toISOString().split('T')[0]

  const metaRows: unknown[][] = [
    ['Результаты ревизии'],
    [''],
    ['Склад:', meta.warehouse ?? '—'],
    ['Дата:', dateStr],
    [''],
  ]

  const dataRows = rows.map(row => [
    row.sku,
    row.barcode ?? '',
    row.name,
    row.unit ?? '',
    row.expectedQty,
    row.actualQty,
    row.diff,
    row.comment ?? '',
  ])

  const ws = XLSX.utils.aoa_to_sheet([...metaRows, EXPORT_HEADERS_XLSX, ...dataRows])

  ws['!cols'] = [
    { wch: 18 }, // Артикул
    { wch: 16 }, // Штрихкод
    { wch: 40 }, // Наименование
    { wch: 10 }, // Ед. изм.
    { wch: 14 }, // Остаток по 1С
    { wch: 10 }, // Факт
    { wch: 13 }, // Расхождение
    { wch: 30 }, // Комментарий
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Ревизия')

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

// ────────────────────────────────────────────────────────────
// Download utility
// ────────────────────────────────────────────────────────────

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
