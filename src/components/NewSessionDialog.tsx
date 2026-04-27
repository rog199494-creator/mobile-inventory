import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Storefront, MapPin, MagnifyingGlass, Check, Buildings, X } from '@phosphor-icons/react'
import { parseExcelData } from '@/lib/inventory'
import type { ProductReference } from '@/lib/types'
import type { Store, Company, StoresResponse } from '@/types/api'
import { api } from '@/services/api'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface NewSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, store: Store | null, company: Company | null, products: ProductReference[]) => void
}

export function NewSessionDialog({ open, onOpenChange, onCreate }: NewSessionDialogProps) {
  const [name, setName] = useState('')
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [products, setProducts] = useState<ProductReference[]>([])
  const [fileName, setFileName] = useState('')
  const [storesData, setStoresData] = useState<StoresResponse | null>(null)
  const [isLoadingStores, setIsLoadingStores] = useState(false)
  const [showStoreList, setShowStoreList] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && !storesData) {
      loadStores()
    }
  }, [open])

  const loadStores = async () => {
    setIsLoadingStores(true)
    try {
      const data = await api.getStores()
      setStoresData(data)
      if (data.stores.length === 0) {
        toast.error('Не удалось загрузить список объектов')
      }
    } catch (error) {
      toast.error('Ошибка при загрузке объектов')
    } finally {
      setIsLoadingStores(false)
    }
  }

  // Group stores by company, filtering by search query
  const groupedStores = (() => {
    if (!storesData) return []
    const q = searchQuery.toLowerCase()
    return storesData.companies
      .map(company => ({
        company,
        stores: storesData.stores.filter(
          s =>
            s.companyId === company.id &&
            (q === '' ||
              s.name.toLowerCase().includes(q) ||
              (s.address?.toLowerCase().includes(q) ?? false) ||
              company.name.toLowerCase().includes(q)),
        ),
      }))
      .filter(g => g.stores.length > 0)
  })()

  const handleStoreSelect = (store: Store, company: Company) => {
    setSelectedStore(store)
    setSelectedCompany(company)
    setShowStoreList(false)
    setSearchQuery('')
  }

  const handleClearStore = () => {
    setSelectedStore(null)
    setSelectedCompany(null)
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
    if (products.length === 0) {
      toast.error('Загрузите список товаров')
      return
    }

    onCreate(name, selectedStore, selectedCompany, products)

    setName('')
    setSelectedStore(null)
    setSelectedCompany(null)
    setProducts([])
    setFileName('')
    setSearchQuery('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6 pb-0">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl">Новая сессия инвентаризации</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6">
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
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm">Выбор объекта</Label>
                <span className="text-xs text-muted-foreground">Опционально</span>
              </div>
              {!showStoreList ? (
                <div className="mt-1.5 sm:mt-2 space-y-2">
                  {selectedStore ? (
                    <div className="flex items-start gap-3 p-3 border rounded-md bg-primary/5 border-primary">
                      <Storefront size={24} className="text-primary shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base truncate">{selectedStore.name}</div>
                        {selectedStore.address && (
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {selectedStore.address}
                          </div>
                        )}
                        {selectedCompany && (
                          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Buildings size={11} className="shrink-0" />
                            {selectedCompany.name}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowStoreList(true)}
                          className="h-8"
                        >
                          Изменить
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearStore}
                          className="h-8 text-muted-foreground"
                        >
                          <X size={14} className="mr-1" />
                          Убрать
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowStoreList(true)}
                        className="w-full h-14 border-dashed"
                        disabled={isLoadingStores}
                      >
                        <Storefront className="mr-2" size={20} />
                        <span className="text-sm sm:text-base">
                          {isLoadingStores ? 'Загрузка объектов...' : 'Выбрать объект'}
                        </span>
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Можно привязать сессию к объекту из Bitrix или пропустить
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-1.5 sm:mt-2 space-y-2">
                  <div className="relative">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск объекта..."
                      className="pl-10 h-11 sm:h-10 text-base sm:text-sm"
                    />
                  </div>

                  <ScrollArea className="h-64 border rounded-md">
                    {groupedStores.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        {searchQuery ? 'Объекты не найдены' : 'Нет доступных объектов'}
                      </div>
                    ) : (
                      <div className="p-1">
                        {groupedStores.map(({ company, stores }) => (
                          <div key={company.id}>
                            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              {company.name}
                            </div>
                            {stores.map((store) => (
                              <button
                                key={store.id}
                                onClick={() => handleStoreSelect(store, company)}
                                className={cn(
                                  "w-full flex items-start gap-3 p-3 rounded-md transition-colors text-left",
                                  "hover:bg-accent active:bg-accent/80",
                                  selectedStore?.id === store.id && "bg-primary/10"
                                )}
                              >
                                <Storefront
                                  size={20}
                                  className={cn(
                                    "shrink-0 mt-0.5",
                                    selectedStore?.id === store.id ? "text-primary" : "text-muted-foreground"
                                  )}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{store.name}</div>
                                  {store.address && (
                                    <div className="flex items-start gap-1 text-xs text-muted-foreground mt-0.5">
                                      <MapPin size={12} className="shrink-0 mt-0.5" />
                                      <span className="line-clamp-2">{store.address}</span>
                                    </div>
                                  )}
                                </div>
                                {selectedStore?.id === store.id && (
                                  <Check size={20} className="text-primary shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <Button
                    variant="outline"
                    onClick={() => setShowStoreList(false)}
                    className="w-full h-10"
                  >
                    Отмена
                  </Button>
                </div>
              )}
            </div>

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
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 px-4 pb-4 sm:px-6 sm:pb-6 border-t pt-4">
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

