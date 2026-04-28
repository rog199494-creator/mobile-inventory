import { useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileCsv, Keyboard, Globe, TelegramLogo, FileDoc, ArrowLeft } from '@phosphor-icons/react'
import { importFromFile } from '@/services/fileExchange'
import type { OneCProduct } from '@/services/fileExchange'
import type { ProductReference } from '@/lib/types'
import type { TelegramImport } from '@/types/api'
import { inventoryApi } from '@/services/api'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

interface StartInventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (source: 'file' | 'manual' | 'telegram', products: ProductReference[], importMeta?: { warehouse?: string; productCount: number }) => void
}

export function StartInventoryDialog({ open, onOpenChange, onSelect }: StartInventoryDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [showTelegramList, setShowTelegramList] = useState(false)
  const [telegramFiles, setTelegramFiles] = useState<TelegramImport[]>([])
  const [isLoadingTelegramFiles, setIsLoadingTelegramFiles] = useState(false)

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

  const handleOpenTelegramList = async () => {
    setShowTelegramList(true)
    setIsLoadingTelegramFiles(true)
    try {
      const files = await inventoryApi.listImports()
      setTelegramFiles(files)
    } catch (err) {
      toast.error(`Не удалось загрузить список файлов: ${(err as Error).message}`)
      setTelegramFiles([])
    } finally {
      setIsLoadingTelegramFiles(false)
    }
  }

  const handleSelectTelegramFile = async (file: TelegramImport) => {
    setIsImporting(true)
    try {
      const blob = await inventoryApi.downloadImport(file.id)
      // Convert Blob to File so importFromFile can detect extension
      const fileObj = new File([blob], file.fileName, { type: blob.type })
      const { products, warehouse, errors } = await importFromFile(fileObj)

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

      setShowTelegramList(false)
      onOpenChange(false)
      onSelect('telegram', productRefs, { warehouse, productCount: productRefs.length })
    } catch (err) {
      toast.error(`Ошибка импорта из Telegram: ${(err as Error).message}`)
    } finally {
      setIsImporting(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} Б`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
  }

  const formatUploadedAt = (iso: string): string => {
    try {
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso))
    } catch {
      return iso
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) setShowTelegramList(false)
      onOpenChange(val)
    }}>
      <DialogContent className="max-w-[95vw] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {showTelegramList ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 -ml-1"
                  onClick={() => setShowTelegramList(false)}
                >
                  <ArrowLeft size={16} />
                </Button>
                Импорт из Telegram
              </div>
            ) : (
              'Источник номенклатуры'
            )}
          </DialogTitle>
        </DialogHeader>

        {showTelegramList ? (
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Выберите файл, отправленный боту <span className="font-mono">@ab_mini_test_bot</span>:
            </p>
            {isLoadingTelegramFiles ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Загрузка...</div>
            ) : telegramFiles.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <TelegramLogo size={32} className="mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Нет загруженных файлов</p>
                <p className="text-xs text-muted-foreground">
                  Отправьте боту <span className="font-mono">@ab_mini_test_bot</span> файл
                  XLSX/CSV с номенклатурой, и он появится здесь.
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-60">
                <div className="space-y-2">
                  {telegramFiles.map((file) => (
                    <button
                      key={file.id}
                      disabled={isImporting}
                      onClick={() => handleSelectTelegramFile(file)}
                      className="w-full flex items-start gap-3 p-3 rounded-md border transition-colors text-left hover:bg-accent active:bg-accent/80 disabled:opacity-50"
                    >
                      <FileDoc size={20} className="shrink-0 mt-0.5 text-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{file.fileName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {formatUploadedAt(file.uploadedAt)} · {formatFileSize(file.size)}
                          {file.productCount != null && ` · ${file.productCount.toLocaleString('ru-RU')} товаров`}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
            {isImporting && (
              <p className="text-xs text-center text-muted-foreground">Загрузка файла...</p>
            )}
          </div>
        ) : (
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

            {/* Option 3: From Telegram bot */}
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex-col gap-2 text-left items-start"
              onClick={handleOpenTelegramList}
            >
              <div className="flex items-center gap-2 w-full">
                <TelegramLogo size={22} className="shrink-0 text-primary" />
                <span className="font-semibold text-sm">✈️ Из Telegram (@ab_mini_test_bot)</span>
              </div>
              <span className="text-xs text-muted-foreground ml-7">
                Выберите XLSX/CSV-файл, отправленный вами боту
              </span>
            </Button>

            {/* Option 4: From client server (disabled) */}
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
        )}
      </DialogContent>
    </Dialog>
  )
}
