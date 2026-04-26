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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Новая сессия инвентаризации</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="session-name">Название сессии</Label>
            <Input
              id="session-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Инвентаризация - Январь 2024"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="store-name">Магазин/Склад</Label>
            <Input
              id="store-name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Центральный склад"
              className="mt-2"
              disabled={isLoadingStore}
            />
            {storeId && (
              <p className="text-xs text-muted-foreground mt-1">
                ID: {storeId}
              </p>
            )}
          </div>

          {isTelegram && (
            <div className="border-t pt-4">
              <Label htmlFor="store-app-url">Выбор из мини-аппа Telegram</Label>
              <div className="space-y-2 mt-2">
                <Input
                  id="store-app-url"
                  value={storeAppUrl || ''}
                  onChange={(e) => setStoreAppUrl(e.target.value)}
                  placeholder="https://t.me/your_store_bot/app"
                  disabled={isLoadingStore}
                />
                <Button
                  variant="outline"
                  onClick={handleSelectStoreFromApp}
                  disabled={isLoadingStore || !(storeAppUrl || '').trim()}
                  className="w-full"
                >
                  <Storefront className="mr-2" size={20} />
                  {isLoadingStore ? 'Ожидание выбора...' : 'Выбрать магазин из приложения'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Откроется другое мини-приложение для выбора магазина
                </p>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <Label>Список товаров (CSV/Excel)</Label>
            <div className="mt-2">
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
                className="w-full h-24 border-dashed"
              >
                <div className="text-center">
                  <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
                  <div className="text-sm">
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleCreate}>
            Создать сессию
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
