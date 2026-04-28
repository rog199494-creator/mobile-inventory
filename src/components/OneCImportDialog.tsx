import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, WarningCircle, CheckCircle, Package, Buildings, Plus, Storefront, X, MagnifyingGlass, MapPin, Check } from '@phosphor-icons/react'
import { importFromFile } from '@/services/fileExchange'
import type { OneCProduct } from '@/services/fileExchange'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { api } from '@/services/api'
import type { Store, Company, StoresResponse } from '@/types/api'
import { cn } from '@/lib/utils'

interface OneCImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (sessionName: string, products: OneCProduct[], warehouse?: string, store?: Store | null, company?: Company | null) => void
}

type ImportState = 'idle' | 'loading' | 'preview' | 'error'

function getDefaultSessionName(): string {
  const date = new Date().toLocaleDateString('ru-RU')
  return `Инвентаризация — ${date}`
}

export function OneCImportDialog({ open, onOpenChange, onConfirm }: OneCImportDialogProps) {
  const [sessionName, setSessionName] = useState('')
  const [state, setState] = useState<ImportState>('idle')
  const [products, setProducts] = useState<OneCProduct[]>([])
  const [warehouse, setWarehouse] = useState<string | undefined>()
  const [errors, setErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Store selection (lazy-loaded on user interaction)
  const [storesData, setStoresData] = useState<StoresResponse | null>(null)
  const [isLoadingStores, setIsLoadingStores] = useState(false)
  const [storesError, setStoresError] = useState(false)
  const [showStoreList, setShowStoreList] = useState(false)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const reset = () => {
    setSessionName('')
    setState('idle')
    setProducts([])
    setWarehouse(undefined)
    setErrors([])
    setFileName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    setStoresData(null)
    setIsLoadingStores(false)
    setStoresError(false)
    setShowStoreList(false)
    setSelectedStore(null)
    setSelectedCompany(null)
    setSearchQuery('')
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  const loadStores = async () => {
    if (storesData || isLoadingStores) return
    setIsLoadingStores(true)
    setStoresError(false)
    try {
      const data = await api.getStores()
      setStoresData(data)
    } catch {
      setStoresError(true)
    } finally {
      setIsLoadingStores(false)
    }
  }

  const handleStoreButtonClick = () => {
    setShowStoreList(true)
    loadStores()
  }

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setState('loading')

    try {
      const result = await importFromFile(file)
      setProducts(result.products)
      setWarehouse(result.warehouse)
      setErrors(result.errors)
      setState('preview')
    } catch (err) {
      setErrors([String(err)])
      setState('error')
    }
  }

  const handleConfirm = () => {
    const name = sessionName.trim() || getDefaultSessionName()
    onConfirm(name, products, warehouse, selectedStore, selectedCompany)
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6 pb-0">
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Plus size={20} className="text-primary" />
            Новая сессия
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {/* Session name */}
          <div>
            <Label htmlFor="new-session-name" className="text-sm">Название сессии</Label>
            <Input
              id="new-session-name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder={getDefaultSessionName()}
              className="mt-1.5 h-10 text-sm"
            />
          </div>

          {/* Optional store picker */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-sm">Объект</Label>
              <span className="text-xs text-muted-foreground">Опционально</span>
            </div>
            {!showStoreList ? (
              <div className="space-y-1.5">
                {selectedStore ? (
                  <div className="flex items-center gap-2 p-2.5 border rounded-md bg-primary/5 border-primary">
                    <Storefront size={16} className="text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{selectedStore.name}</div>
                      {selectedCompany && (
                        <div className="text-xs text-muted-foreground">{selectedCompany.name}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => { setSelectedStore(null); setSelectedCompany(null) }}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleStoreButtonClick}
                    className="w-full h-10 border-dashed text-sm"
                    disabled={storesError}
                  >
                    <Storefront className="mr-2" size={16} />
                    {storesError ? 'Не удалось загрузить объекты' : 'Выбрать объект'}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск объекта..."
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                <ScrollArea className="h-48 border rounded-md">
                  {isLoadingStores ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Загрузка...</div>
                  ) : storesError ? (
                    <div className="p-4 text-center text-sm text-destructive">Не удалось загрузить объекты</div>
                  ) : groupedStores.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {searchQuery ? 'Объекты не найдены' : 'Нет доступных объектов'}
                    </div>
                  ) : (
                    <div className="p-1">
                      {groupedStores.map(({ company, stores }) => (
                        <div key={company.id}>
                          <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {company.name}
                          </div>
                          {stores.map((store) => (
                            <button
                              key={store.id}
                              onClick={() => {
                                setSelectedStore(store)
                                setSelectedCompany(company)
                                setShowStoreList(false)
                                setSearchQuery('')
                              }}
                              className={cn(
                                'w-full flex items-center gap-2 p-2 rounded-md transition-colors text-left',
                                'hover:bg-accent active:bg-accent/80',
                                selectedStore?.id === store.id && 'bg-primary/10'
                              )}
                            >
                              <Storefront
                                size={16}
                                className={cn('shrink-0', selectedStore?.id === store.id ? 'text-primary' : 'text-muted-foreground')}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{store.name}</div>
                                {store.address && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin size={11} className="shrink-0" />
                                    <span className="truncate">{store.address}</span>
                                  </div>
                                )}
                              </div>
                              {selectedStore?.id === store.id && <Check size={16} className="text-primary shrink-0" />}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <Button variant="outline" onClick={() => setShowStoreList(false)} className="w-full h-9 text-sm">
                  Отмена
                </Button>
              </div>
            )}
          </div>

          {/* File picker */}
          <div>
            <Label className="text-sm">Список товаров</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-20 border-dashed mt-1.5"
              disabled={state === 'loading'}
            >
              <div className="text-center">
                <Upload size={24} className="mx-auto mb-1 text-muted-foreground" />
                <div className="text-sm">
                  {state === 'loading'
                    ? 'Читаю файл...'
                    : fileName || 'Загрузить файл (CSV / XLSX)'}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Остатки из 1С / SAP • Можно создать пустую сессию без файла
                </div>
              </div>
            </Button>
          </div>

          {/* Preview */}
          {state === 'preview' && (
            <div className="space-y-3">
              <div className="rounded-lg border bg-card p-3 sm:p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Package size={16} className="text-primary shrink-0" />
                  <span className="text-muted-foreground">Найдено позиций:</span>
                  <span className="font-semibold font-mono">{products.length}</span>
                </div>
                {warehouse && (
                  <div className="flex items-center gap-2 text-sm">
                    <Buildings size={16} className="text-primary shrink-0" />
                    <span className="text-muted-foreground">Склад:</span>
                    <span className="font-semibold">{warehouse}</span>
                  </div>
                )}
                {errors.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <WarningCircle size={16} className="text-warning shrink-0" />
                    <span className="text-muted-foreground">Ошибок:</span>
                    <Badge variant="secondary" className="text-warning font-mono">
                      {errors.length}
                    </Badge>
                  </div>
                )}
                {products.length > 0 && errors.length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-success">
                    <CheckCircle size={16} className="shrink-0" />
                    <span>Файл прочитан без ошибок</span>
                  </div>
                )}
              </div>

              {errors.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Пропущенные строки:
                  </p>
                  <ScrollArea className="h-32 rounded border bg-muted/40 p-2">
                    {errors.map((err, i) => (
                      <p key={i} className="text-xs text-warning py-0.5 font-mono">
                        {err}
                      </p>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          {state === 'error' && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm text-destructive font-medium">
                <WarningCircle size={16} />
                Ошибка чтения файла
              </div>
              {errors.map((err, i) => (
                <p key={i} className="text-xs text-muted-foreground font-mono">{err}</p>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 px-4 pb-4 sm:px-6 sm:pb-6 border-t pt-4">
          <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={state === 'loading'}
            className="w-full sm:w-auto"
          >
            {products.length > 0
              ? `Создать сессию (${products.length} позиций)`
              : 'Создать сессию'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
