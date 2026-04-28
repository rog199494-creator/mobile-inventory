import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Barcode, Plus, Minus, Check, WifiSlash, WifiHigh, ArrowLeft, Camera } from '@phosphor-icons/react'
import type { InventorySession, ProductReference, ScanRecord } from '@/lib/types'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { BarcodeScanner } from '@/components/BarcodeScanner'
import { StepIndicator } from '@/components/StepIndicator'
import { ScanHistory } from '@/components/ScanHistory'
import { useLocalStorage } from '@/hooks/useLocalStorage'

interface ScannerInterfaceProps {
  session: InventorySession
  onScan: (barcode: string, quantity: number) => void
  onBack: () => void
  isOnline: boolean
  pendingScans: number
  onDeleteScan?: (sessionId: string, scanId: string) => void
  onRestoreScan?: (sessionId: string, scan: ScanRecord) => void
  onUpdateScanQuantity?: (sessionId: string, scanId: string, newQuantity: number) => void
}

const SCANNER_STEPS = [
  { id: 'setup', label: 'Подготовка', description: 'Настройка сканера', mobileLabel: 'Подгот.' },
  { id: 'scanning', label: 'Сканирование', description: 'Процесс учёта', mobileLabel: 'Сканир.' },
  { id: 'review', label: 'Проверка', description: 'Контроль данных', mobileLabel: 'Проверка' },
  { id: 'complete', label: 'Завершение', description: 'Финализация', mobileLabel: 'Заверш.' }
]

export function ScannerInterface({ session, onScan, onBack, isOnline, pendingScans, onDeleteScan, onRestoreScan, onUpdateScanQuantity }: ScannerInterfaceProps) {
  const [barcode, setBarcode] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [lastScanned, setLastScanned] = useState<ProductReference | null>(null)
  const [lastScannedQuantity, setLastScannedQuantity] = useState(1)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [deletedScans, setDeletedScans] = useLocalStorage<ScanRecord[]>(`deleted-scans-${session.id}`, [])
  const inputRef = useRef<HTMLInputElement>(null)
  const quantityRef = useRef(1)

  useEffect(() => {
    quantityRef.current = quantity
  }, [quantity])

  useEffect(() => {
    if (session.scans.length === 0) {
      setCurrentStep(0)
    } else if (session.scans.length > 0 && session.scans.length < session.products.length * 0.5) {
      setCurrentStep(1)
    } else if (session.scans.length >= session.products.length * 0.5) {
      setCurrentStep(2)
    }
  }, [session.scans.length, session.products.length])



  useEffect(() => {
    setIsCameraActive(true)
  }, [])

  const handleScan = (scannedBarcode?: string) => {
    const codeToScan = scannedBarcode || barcode
    const currentQuantity = quantityRef.current

    if (!codeToScan.trim()) {
      toast.error('Введите штрихкод')
      return
    }

    const product = session.products.find(p => p.barcode === codeToScan)
    
    onScan(codeToScan, currentQuantity)
    setLastScanned(product || { barcode: codeToScan, name: 'Неизвестный товар', expectedQty: 0, price: 0 })
    setLastScannedQuantity(currentQuantity)
    setShowConfirm(true)
    
    setTimeout(() => {
      setShowConfirm(false)
      setBarcode('')
      setQuantity(1)
    }, 1500)

    toast.success(`Отсканировано: ${product?.name || 'Неизвестно'} (${currentQuantity})`)
  }

  const handleCameraScan = (scannedBarcode: string) => {
    const currentQuantity = quantityRef.current
    const product = session.products.find(p => p.barcode === scannedBarcode)
    
    onScan(scannedBarcode, currentQuantity)
    setLastScanned(product || { barcode: scannedBarcode, name: 'Неизвестный товар', expectedQty: 0, price: 0 })
    setLastScannedQuantity(currentQuantity)
    
    setIsCameraActive(false)
    setShowConfirm(true)
    
    setTimeout(() => {
      setShowConfirm(false)
      setBarcode('')
      setQuantity(1)
    }, 2000)

    toast.success(`Отсканировано: ${product?.name || 'Неизвестно'} (${currentQuantity})`)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan()
    }
  }

  const totalScanned = session.scans.reduce((sum, s) => sum + s.actualQty, 0)

  if (isCameraActive) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b shadow-sm shrink-0 sticky-header">
            <div style={{ height: 'var(--safe-area-top)' }} aria-hidden="true" />
            <div className="px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setIsCameraActive(false)}>
                <ArrowLeft className="mr-1 sm:mr-2" size={16} />
                Назад
              </Button>
              <Badge variant={isOnline ? 'default' : 'destructive'} className="px-2 py-1 text-xs sm:px-3">
                {isOnline ? (
                  <>
                    <WifiHigh size={14} className="mr-1" />
                    <span className="hidden sm:inline">Онлайн</span>
                  </>
                ) : (
                  <>
                    <WifiSlash size={14} className="mr-1" />
                    <span className="hidden sm:inline">Офлайн</span> ({pendingScans})
                  </>
                )}
              </Badge>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-3 py-3 sm:px-4 sm:py-4 bg-card border-b shrink-0">
              <h2 className="text-lg sm:text-xl font-bold mb-1">{session.name}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Позиций: {totalScanned}</span>
                <span>Товаров: {new Set(session.scans.map(s => s.barcode)).size}</span>
              </div>
            </div>

            <div className="px-3 py-2 sm:px-4 bg-card border-b shrink-0">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Количество:</label>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus size={18} />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-center text-lg font-mono font-bold h-9 w-20"
                  min="1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus size={18} />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden min-h-0">
              <BarcodeScanner
                onScan={handleCameraScan}
                isActive={isCameraActive}
                onToggle={() => setIsCameraActive(!isCameraActive)}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 pb-safe">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b px-3 py-3 sm:px-4 sm:py-3 shadow-sm sticky-header">
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="default" onClick={onBack} className="h-10 sm:h-9">
            <ArrowLeft className="mr-1 sm:mr-2" size={18} />
            <span className="sm:inline">Назад</span>
          </Button>
          <Badge variant={isOnline ? 'default' : 'destructive'} className="px-2 py-1.5 text-xs sm:px-3 shrink-0">
            {isOnline ? (
              <>
                <WifiHigh size={14} className="mr-1" />
                <span className="hidden sm:inline">Онлайн</span>
              </>
            ) : (
              <>
                <WifiSlash size={14} className="mr-1" />
                <span className="hidden sm:inline">Офлайн</span> ({pendingScans})
              </>
            )}
          </Badge>
        </div>
      </div>

      <div className="px-3 py-3 sm:px-4 sm:py-4 space-y-3 sm:space-y-4 max-w-2xl mx-auto">
        <Card className="p-3 sm:p-4 bg-card/80 backdrop-blur-sm overflow-x-auto">
          <StepIndicator steps={SCANNER_STEPS} currentStep={currentStep} />
        </Card>

        <Card className="p-4 sm:p-5 md:p-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 break-words">{session.name}</h2>
          <p className="text-sm text-muted-foreground mb-4 break-words">{session.storeName}</p>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="p-3 sm:p-4 bg-secondary rounded-lg min-w-0">
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Всего позиций</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-mono font-bold break-all">{totalScanned}</div>
            </div>
            <div className="p-3 sm:p-4 bg-secondary rounded-lg min-w-0">
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Товаров</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-mono font-bold break-all">{new Set(session.scans.map(s => s.barcode)).size}</div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Количество</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 sm:h-12 sm:w-12 shrink-0"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={showConfirm}
                >
                  <Minus size={22} className="sm:w-5 sm:h-5" />
                </Button>
                <Input
                  id="quantity-input"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-center text-2xl sm:text-3xl font-mono font-bold h-14 sm:h-16"
                  disabled={showConfirm}
                  min="1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 sm:h-12 sm:w-12 shrink-0"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={showConfirm}
                >
                  <Plus size={22} className="sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>

            <Button
              className="w-full h-14 sm:h-16 text-base sm:text-lg"
              onClick={() => setIsCameraActive(true)}
              disabled={showConfirm}
            >
              <Camera className="mr-2" size={24} />
              Сканировать штрихкод
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">или ввести вручную</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Ручной ввод штрихкода</label>
              <Input
                ref={inputRef}
                id="barcode-input"
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Введите штрихкод..."
                className="text-base sm:text-lg font-mono h-12 sm:h-14"
                disabled={showConfirm}
              />
            </div>

            <Button
              className="w-full h-12 sm:h-14 text-base sm:text-lg"
              onClick={() => handleScan(undefined)}
              disabled={showConfirm}
              variant="secondary"
            >
              <Barcode className="mr-2" size={24} />
              Записать
            </Button>
          </div>
        </Card>

        <AnimatePresence>
          {showConfirm && lastScanned && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-4 sm:p-5 md:p-6 bg-success/10 border-success">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success rounded-full flex items-center justify-center shrink-0">
                    <Check size={20} className="text-success-foreground sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base sm:text-lg truncate">{lastScanned.name}</h3>
                    <p className="text-xs sm:text-sm font-mono text-muted-foreground truncate">{lastScanned.barcode}</p>
                  </div>
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-success shrink-0">+{lastScannedQuantity}</div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {session.scans.length > 0 && (
          <ScanHistory
            scans={session.scans}
            products={session.products}
            deletedScans={deletedScans || []}
            onDelete={(scanId) => {
              const scan = session.scans.find(s => s.id === scanId)
              if (scan) {
                setDeletedScans(current => [...(current || []), scan])
                onDeleteScan?.(session.id, scanId)
              }
            }}
            onRestore={(scan) => {
              setDeletedScans(current => (current || []).filter(s => s.id !== scan.id))
              onRestoreScan?.(session.id, scan)
            }}
            onRepeat={(barcode, quantity) => {
              onScan(barcode, quantity)
            }}
            onUpdateQuantity={(scanId, newQuantity) => {
              onUpdateScanQuantity?.(session.id, scanId, newQuantity)
            }}
          />
        )}
      </div>
    </div>
  )
}
