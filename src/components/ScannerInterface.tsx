import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Barcode, Plus, Minus, Check, WifiSlash, WifiHigh } from '@phosphor-icons/react'
import type { InventorySession, ProductReference } from '@/lib/types'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { BarcodeScanner } from '@/components/BarcodeScanner'

interface ScannerInterfaceProps {
  session: InventorySession
  onScan: (barcode: string, quantity: number) => void
  onBack: () => void
  isOnline: boolean
  pendingScans: number
}

export function ScannerInterface({ session, onScan, onBack, isOnline, pendingScans }: ScannerInterfaceProps) {
  const [barcode, setBarcode] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [lastScanned, setLastScanned] = useState<ProductReference | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isCameraActive) {
      inputRef.current?.focus()
    }
  }, [showConfirm, isCameraActive])

  const handleScan = (scannedBarcode?: string) => {
    const codeToScan = scannedBarcode || barcode

    if (!codeToScan.trim()) {
      toast.error('Введите штрихкод')
      return
    }

    const product = session.products.find(p => p.barcode === codeToScan)
    
    onScan(codeToScan, quantity)
    setLastScanned(product || { barcode: codeToScan, name: 'Неизвестный товар', expectedQty: 0, price: 0 })
    setShowConfirm(true)
    
    setTimeout(() => {
      setShowConfirm(false)
      setBarcode('')
      setQuantity(1)
    }, 1500)

    toast.success(`Отсканировано: ${product?.name || 'Неизвестно'} (${quantity})`)
  }

  const handleCameraScan = (scannedBarcode: string) => {
    setBarcode(scannedBarcode)
    handleScan(scannedBarcode)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan()
    }
  }

  const totalScanned = session.scans.reduce((sum, s) => sum + s.actualQty, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={onBack}>
            ← Назад
          </Button>
          <Badge variant={isOnline ? 'default' : 'destructive'} className="px-3 py-1">
            {isOnline ? (
              <>
                <WifiHigh size={14} className="mr-1" />
                Онлайн
              </>
            ) : (
              <>
                <WifiSlash size={14} className="mr-1" />
                Офлайн ({pendingScans} в очереди)
              </>
            )}
          </Badge>
        </div>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-2">{session.name}</h2>
          <p className="text-muted-foreground mb-4">{session.storeName}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-secondary rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Всего позиций</div>
              <div className="text-3xl font-mono font-bold">{totalScanned}</div>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Товаров</div>
              <div className="text-3xl font-mono font-bold">{new Set(session.scans.map(s => s.barcode)).size}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Количество</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={showConfirm || isCameraActive}
                >
                  <Minus />
                </Button>
                <Input
                  id="quantity-input"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-center text-xl font-mono font-bold h-12"
                  disabled={showConfirm || isCameraActive}
                  min="1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={showConfirm || isCameraActive}
                >
                  <Plus />
                </Button>
              </div>
            </div>

            <BarcodeScanner
              onScan={handleCameraScan}
              isActive={isCameraActive}
              onToggle={() => setIsCameraActive(!isCameraActive)}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">или</span>
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
                className="text-lg font-mono h-12"
                disabled={showConfirm || isCameraActive}
              />
            </div>

            <Button
              className="w-full h-14 text-lg"
              onClick={() => handleScan(undefined)}
              disabled={showConfirm || isCameraActive}
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
              <Card className="p-6 bg-success/10 border-success">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center">
                    <Check size={24} className="text-success-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{lastScanned.name}</h3>
                    <p className="text-sm font-mono text-muted-foreground">{lastScanned.barcode}</p>
                  </div>
                  <div className="text-3xl font-mono font-bold text-success">+{quantity}</div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {session.scans.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Последние сканирования</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {session.scans.slice(-10).reverse().map((scan, idx) => {
                const product = session.products.find(p => p.barcode === scan.barcode)
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-secondary rounded">
                    <div>
                      <div className="font-medium">{product?.name || 'Неизвестный товар'}</div>
                      <div className="text-sm font-mono text-muted-foreground">{scan.barcode}</div>
                    </div>
                    <div className="font-mono font-bold">+{scan.actualQty}</div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
