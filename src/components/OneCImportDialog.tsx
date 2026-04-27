import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, WarningCircle, CheckCircle, Package, Buildings } from '@phosphor-icons/react'
import { importFromFile } from '@/services/fileExchange'
import type { OneCProduct } from '@/services/fileExchange'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface OneCImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (products: OneCProduct[], warehouse?: string) => void
}

type ImportState = 'idle' | 'loading' | 'preview' | 'error'

export function OneCImportDialog({ open, onOpenChange, onConfirm }: OneCImportDialogProps) {
  const [state, setState] = useState<ImportState>('idle')
  const [products, setProducts] = useState<OneCProduct[]>([])
  const [warehouse, setWarehouse] = useState<string | undefined>()
  const [errors, setErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setState('idle')
    setProducts([])
    setWarehouse(undefined)
    setErrors([])
    setFileName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

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
    onConfirm(products, warehouse)
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6 pb-0">
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Upload size={20} className="text-primary" />
            Импорт из 1С
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {/* File picker */}
          <div>
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
              className="w-full h-20 border-dashed"
              disabled={state === 'loading'}
            >
              <div className="text-center">
                <Upload size={24} className="mx-auto mb-1 text-muted-foreground" />
                <div className="text-sm">
                  {state === 'loading'
                    ? 'Читаю файл...'
                    : fileName || 'Выберите файл CSV или XLSX'}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Остатки из 1С / SAP
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
            disabled={state !== 'preview' || products.length === 0}
            className="w-full sm:w-auto"
          >
            Начать ревизию ({products.length} позиций)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
