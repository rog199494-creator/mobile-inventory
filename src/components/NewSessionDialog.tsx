import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Storefront } from '@phosphor-icons/react'
import { parseExcelData } from '@/lib/inventory'
import type { ProductReference } from '@/lib/types'
import type { StoreData } from '@/lib/telegram'
import { openStoreSelectionApp, isTelegramWebApp } from '@/lib/telegram'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

interface NewSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, storeName: string, products: ProductReference[]) => void
}

export function NewSessionDialog({ open, onOpenChange, onCreate }: NewSessionDialogProps) {
  const [name, setName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [storeId, setStoreId] = useState('')
  const [products, setProducts] = useState<ProductReference[]>([])
  const [fileName, setFileName] = useState('')
  const [isLoadingStore, setIsLoadingStore] = useState(false)
  const [storeAppUrl, setStoreAppUrl] = useKV('store-app-url', '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isTelegram = isTelegramWebApp()

  const handleSelectStoreFromApp = async () => {
    const url = storeAppUrl || ''
    if (!url.trim()) {
      toast.error('Введите URL мини-аппа для выбора магазина')
      return
    }

    setIsLoadingStore(true)
    try {
      const store = await openStoreSelectionApp(url)
      
      if (store) {
        setStoreName(store.name)
        setStoreId(store.id)
        toast.success(`Выбран магазин: ${store.name}`)
      } else {
        toast.error('Магазин не был выбран')
      }
    } catch (error) {
      toast.error('Ошибка при получении данных магазина')
    } finally {
      setIsLoadingStore(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    const text = await file.text()
    try {
      const parsed = parseExcelData(text)
      setProducts(parsed)
      toast.success(`Загружено ${parsed.length} товаров из файла`)
    } catch (error) {
      toast.error('Ошибка при чтении файла. Проверьте формат.')
    }
  }

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('Введите название сессии')
      return
    }
    if (!storeName.trim()) {
      toast.error('Введите название магазина')
      return
    }
    if (products.length === 0) {
      toast.error('Загрузите список товаров')
      return
    }

    onCreate(name, storeName, products)
    
    setName('')
    setStoreName('')
    setStoreId('')
    setProducts([])
    setFileName('')
    setStoreAppUrl('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl md:text-2xl">Новая сессия инвентаризации</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
          <div>
            <Label htmlFor="session-name" className="text-sm">Название сессии</Label>
            <Input
              id="session-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Инвентаризация - Январь 2024"
              className="mt-1.5 sm:mt-2 h-11 sm:h-10 text-base sm:text-sm"
            />
          </div>

          <div>
            <Label htmlFor="store-name" className="text-sm">Магазин/Склад</Label>
            <Input
              id="store-name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Центральный склад"
              className="mt-1.5 sm:mt-2 h-11 sm:h-10 text-base sm:text-sm"
              disabled={isLoadingStore}
            />
            {storeId && (
              <p className="text-xs text-muted-foreground mt-1">
                ID: {storeId}
              </p>
            )}
          </div>

          {isTelegram && (
            <div className="border-t pt-3 sm:pt-4">
              <Label htmlFor="store-app-url" className="text-sm">Выбор из мини-аппа Telegram</Label>
              <div className="space-y-2 mt-1.5 sm:mt-2">
                <Input
                  id="store-app-url"
                  value={storeAppUrl || ''}
                  onChange={(e) => setStoreAppUrl(e.target.value)}
                  placeholder="https://t.me/your_store_bot/app"
                  disabled={isLoadingStore}
                  className="h-11 sm:h-10 text-base sm:text-sm"
                />
                <Button
                  variant="outline"
                  onClick={handleSelectStoreFromApp}
                  disabled={isLoadingStore || !(storeAppUrl || '').trim()}
                  className="w-full h-11 sm:h-10"
                >
                  <Storefront className="mr-2" size={18} />
                  <span className="text-sm sm:text-base">{isLoadingStore ? 'Ожидание выбора...' : 'Выбрать магазин'}</span>
                </Button>
                <p className="text-xs text-muted-foreground">
                  Откроется другое мини-приложение для выбора магазина
                </p>
              </div>
            </div>
          )}

          <div className="border-t pt-3 sm:pt-4">
            <Label className="text-sm">Список товаров (CSV/Excel)</Label>
            <div className="mt-1.5 sm:mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-20 sm:h-24 border-dashed"
              >
                <div className="text-center">
                  <Upload size={28} className="mx-auto mb-1.5 sm:mb-2 text-muted-foreground sm:w-8 sm:h-8" />
                  <div className="text-xs sm:text-sm">
                    {fileName || 'Нажмите для загрузки CSV'}
                  </div>
                  {products.length > 0 && (
                    <div className="text-xs text-success mt-1">
                      {products.length} товаров загружено
                    </div>
                  )}
                </div>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Формат: Штрихкод, Название, Ожидаемое кол-во, Цена
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-11 sm:h-10">
            Отмена
          </Button>
          <Button onClick={handleCreate} className="w-full sm:w-auto h-11 sm:h-10">
            Создать сессию
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
