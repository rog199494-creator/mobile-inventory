import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Trash, ArrowCounterClockwise, Copy, PencilSimple, X, Check } from '@phosphor-icons/react'
import type { ScanRecord, ProductReference } from '@/lib/types'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ScanHistoryProps {
  scans: ScanRecord[]
  products: ProductReference[]
  onDelete: (scanId: string) => void
  onRestore: (scan: ScanRecord) => void
  onRepeat: (barcode: string, quantity: number) => void
  onUpdateQuantity?: (scanId: string, newQuantity: number) => void
  deletedScans: ScanRecord[]
}

export function ScanHistory({ 
  scans, 
  products, 
  onDelete, 
  onRestore, 
  onRepeat,
  onUpdateQuantity,
  deletedScans 
}: ScanHistoryProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showDeleted, setShowDeleted] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(1)

  const handleDelete = (scanId: string) => {
    onDelete(scanId)
    setDeleteConfirmId(null)
    toast.success('Запись удалена')
  }

  const handleRestore = (scan: ScanRecord) => {
    onRestore(scan)
    toast.success('Запись восстановлена')
  }

  const handleRepeat = (barcode: string, quantity: number) => {
    onRepeat(barcode, quantity)
    toast.success('Повторено', {
      icon: '✓',
    })
  }

  const startEdit = (scanId: string, currentQty: number) => {
    setEditingId(scanId)
    setEditValue(currentQty)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue(1)
  }

  const saveEdit = (scanId: string) => {
    if (!editValue || editValue < 1) {
      toast.error('Количество должно быть больше 0')
      return
    }
    onUpdateQuantity?.(scanId, editValue)
    setEditingId(null)
    toast.success('Количество изменено')
  }

  const getProductInfo = (barcode: string) => {
    return products.find(p => p.barcode === barcode)
  }

  if (scans.length === 0 && deletedScans.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">История сканирований пуста</p>
      </Card>
    )
  }

  return (
    <>
      <Card className="p-3 sm:p-4 md:p-5">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="font-semibold text-sm sm:text-base">История сканирований</h3>
          {deletedScans.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleted(!showDeleted)}
              className="text-xs sm:text-sm"
            >
              {showDeleted ? 'Скрыть удалённые' : `Удалённые (${deletedScans.length})`}
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px] sm:h-[400px] pr-3">
          <AnimatePresence mode="popLayout">
            {!showDeleted && scans.slice().reverse().map((scan) => {
              const product = getProductInfo(scan.barcode)
              const isEditing = editingId === scan.id
              return (
                <motion.div
                  key={scan.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="mb-2 sm:mb-3"
                >
                  <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-secondary rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base truncate">
                        {product?.name || 'Неизвестный товар'}
                      </div>
                      <div className="text-xs sm:text-sm font-mono text-muted-foreground truncate">
                        {scan.barcode}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(scan.scannedAt).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            value={editValue === 0 ? '' : editValue}
                            onChange={(e) => {
                              const val = e.target.value
                              if (val === '') {
                                setEditValue(0)
                              } else {
                                const num = parseInt(val)
                                if (!isNaN(num)) {
                                  setEditValue(num)
                                }
                              }
                            }}
                            className="w-16 h-9 text-center font-mono text-sm"
                            min="1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveEdit(scan.id)
                              } else if (e.key === 'Escape') {
                                cancelEdit()
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-success hover:text-success hover:bg-success/10"
                            onClick={() => saveEdit(scan.id)}
                            title="Сохранить"
                          >
                            <Check size={18} weight="bold" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 hover:bg-muted"
                            onClick={cancelEdit}
                            title="Отменить"
                          >
                            <X size={18} />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Badge 
                            variant="default" 
                            className="font-mono text-sm sm:text-base px-2.5 py-1 cursor-pointer hover:bg-primary/80"
                            onClick={() => startEdit(scan.id, scan.actualQty)}
                          >
                            +{scan.actualQty}
                          </Badge>
                          <div className="flex gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 sm:h-10 sm:w-10 hover:bg-accent/10"
                              onClick={() => handleRepeat(scan.barcode, scan.actualQty)}
                              title="Повторить"
                            >
                              <Copy size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 sm:h-10 sm:w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteConfirmId(scan.id)}
                              title="Удалить"
                            >
                              <Trash size={16} />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {showDeleted && deletedScans.slice().reverse().map((scan) => {
              const product = getProductInfo(scan.barcode)
              return (
                <motion.div
                  key={scan.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="mb-2 sm:mb-3"
                >
                  <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex-1 min-w-0 opacity-60">
                      <div className="font-medium text-sm sm:text-base truncate line-through">
                        {product?.name || 'Неизвестный товар'}
                      </div>
                      <div className="text-xs sm:text-sm font-mono text-muted-foreground truncate">
                        {scan.barcode}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(scan.scannedAt).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant="outline" className="font-mono text-sm sm:text-base px-2.5 py-1 opacity-60">
                        +{scan.actualQty}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-sm"
                        onClick={() => handleRestore(scan)}
                      >
                        <ArrowCounterClockwise size={16} className="mr-1.5" />
                        Восстановить
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </ScrollArea>
      </Card>

      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
            <AlertDialogDescription>
              Эта запись будет перемещена в удалённые. Вы сможете восстановить её позже.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
