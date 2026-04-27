import { useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileCsv, Keyboard, Globe } from '@phosphor-icons/react'
import { importFromFile } from '@/services/fileExchange'
import type { OneCProduct } from '@/services/fileExchange'
import type { ProductReference } from '@/lib/types'
import { toast } from 'sonner'

interface StartInventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (source: 'file' | 'manual', products: ProductReference[], importMeta?: { warehouse?: string; productCount: number }) => void
}

export function StartInventoryDialog({ open, onOpenChange, onSelect }: StartInventoryDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so the same file can be selected again
    e.target.value = ''

    setIsImporting(true)
    try {
      const { products, warehouse, errors } = await importFromFile(file)

      if (errors.length > 0) {
        toast.warning(`Импортировано с ошибками: ${errors.slice(0, 3).join('; ')}`)
      }

      if (products.length === 0) {
        toast.error('Файл не содержит товаров')
        return
      }

      const productRefs: ProductReference[] = products.map((p: OneCProduct) => ({
        barcode: p.barcode ?? p.sku,
        name: p.name,
        expectedQty: p.expectedQty,
        price: p.price ?? 0,
      }))

      onOpenChange(false)
      onSelect('file', productRefs, { warehouse, productCount: productRefs.length })
    } catch (err) {
      toast.error(`Ошибка импорта: ${(err as Error).message}`)
    } finally {
      setIsImporting(false)
    }
  }

  const handleManual = () => {
    onOpenChange(false)
    onSelect('manual', [])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Источник номенклатуры</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Option 1: Import from 1C file */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.txt"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            className="w-full h-auto py-4 flex-col gap-2 text-left items-start"
            disabled={isImporting}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex items-center gap-2 w-full">
              <FileCsv size={22} className="shrink-0 text-primary" />
              <span className="font-semibold text-sm">
                {isImporting ? 'Импорт...' : '📁 Импорт из 1С (файл CSV/XLSX)'}
              </span>
            </div>
            <span className="text-xs text-muted-foreground ml-7">
              Загрузите файл выгрузки остатков из 1С
            </span>
          </Button>

          {/* Option 2: Manual / empty session */}
          <Button
            variant="outline"
            className="w-full h-auto py-4 flex-col gap-2 text-left items-start"
            onClick={handleManual}
          >
            <div className="flex items-center gap-2 w-full">
              <Keyboard size={22} className="shrink-0 text-primary" />
              <span className="font-semibold text-sm">⌨️ Пустая сессия (ручной ввод / сканер)</span>
            </div>
            <span className="text-xs text-muted-foreground ml-7">
              Сканируйте товары без предзагруженного справочника
            </span>
          </Button>

          {/* Option 3: From client server (disabled) */}
          <Button
            variant="outline"
            className="w-full h-auto py-4 flex-col gap-2 text-left items-start opacity-50 cursor-not-allowed"
            disabled
          >
            <div className="flex items-center gap-2 w-full">
              <Globe size={22} className="shrink-0 text-muted-foreground" />
              <span className="font-semibold text-sm">🌐 С сервера клиента</span>
            </div>
            <span className="text-xs text-muted-foreground ml-7">
              Скоро. Эндпоинт{' '}
              <code className="font-mono">GET /bitrix/stores/:id/products</code> в разработке.
            </span>
          </Button>
          {/* TODO: when client server adds GET /bitrix/stores/:id/products,
              call api.getStoreProducts(storeId) and use the result as expected stock. */}
        </div>
      </DialogContent>
    </Dialog>
  )
}
