import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload } from '@phosphor-icons/react'
import { parseExcelData } from '@/lib/inventory'
import type { ProductReference } from '@/lib/types'
import { toast } from 'sonner'

interface NewSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, storeName: string, products: ProductReference[]) => void
}

export function NewSessionDialog({ open, onOpenChange, onCreate }: NewSessionDialogProps) {
  const [name, setName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [products, setProducts] = useState<ProductReference[]>([])
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    setProducts([])
    setFileName('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
            />
          </div>

          <div>
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
