export type SessionStatus = 'planned' | 'active' | 'completed'

export type VarianceType = 'shortage' | 'surplus' | 'unknown' | 'match'

export interface ProductReference {
  barcode: string
  name: string
  expectedQty: number
  price: number
}

export interface ScanRecord {
  id: string
  barcode: string
  actualQty: number
  scannedAt: number
  scannedBy: string
  isSynced: boolean
}

export interface OneCImportMeta {
  warehouse?: string
  importedAt: number
  productCount: number
}

export interface InventorySession {
  id: string
  name: string
  storeName: string
  status: SessionStatus
  createdAt: number
  startedAt?: number
  completedAt?: number
  products: ProductReference[]
  scans: ScanRecord[]
  importMeta?: OneCImportMeta
}

export interface VarianceItem {
  barcode: string
  name: string
  expectedQty: number
  actualQty: number
  variance: number
  varianceValue: number
  varianceType: VarianceType
  price: number
}

export interface SessionSummary {
  totalProducts: number
  scannedProducts: number
  totalVariance: number
  totalVarianceValue: number
  shortageCount: number
  surplusCount: number
  unknownCount: number
  matchCount: number
}
