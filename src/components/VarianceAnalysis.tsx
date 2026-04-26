import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Download, TrendUp, TrendDown, Warning, CheckCircle, Lock, FileXls } from '@phosphor-icons/react'
import type { InventorySession, VarianceItem } from '@/lib/types'
import { calculateVariances, calculateSummary, generateExcelCSV, generateExcelFile, downloadCSV, formatNumber, formatCurrency, formatDate } from '@/lib/inventory'
import { toast } from 'sonner'

interface VarianceAnalysisProps {
  session: InventorySession
  onBack: () => void
  onComplete?: (sessionId: string) => void
}

export function VarianceAnalysis({ session, onBack, onComplete }: VarianceAnalysisProps) {
  const [filter, setFilter] = useState<'all' | 'shortage' | 'surplus' | 'unknown'>('all')
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  
  const variances = useMemo(() => calculateVariances(session), [session])
  const summary = useMemo(() => calculateSummary(variances), [variances])

  const filteredVariances = useMemo(() => {
    if (filter === 'all') return variances
    return variances.filter(v => v.varianceType === filter)
  }, [variances, filter])

  const handleExportCSV = () => {
    const csv = generateExcelCSV(variances)
    downloadCSV(csv, `Инвентаризация_${session.name}_${Date.now()}.csv`)
    toast.success('CSV файл загружен')
  }

  const handleExportExcel = () => {
    try {
      generateExcelFile(session, variances)
      toast.success('Excel файл загружен')
    } catch (error) {
      toast.error('Ошибка при создании Excel файла')
    }
  }

  const handleCompleteSession = () => {
    if (onComplete) {
      onComplete(session.id)
      toast.success('Сессия завершена успешно')
      setShowCompleteDialog(false)
      onBack()
    }
  }

  const isCompleted = session.status === 'completed'

  return (
    <div className="min-h-screen bg-background pb-safe">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b px-3 py-3 sm:px-4 sm:py-4 shadow-sm">
        <Button variant="outline" size="default" onClick={onBack} className="mb-3 h-10 sm:h-9">
          ← Назад
        </Button>
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-base sm:text-lg md:text-2xl font-bold break-words">{session.name}</h1>
                {isCompleted && (
                  <Badge className="bg-muted text-muted-foreground shrink-0 text-xs">
                    <Lock className="mr-1" size={12} />
                    Завершена
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground break-words">{session.storeName}</p>
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                Создана {formatDate(session.createdAt)}
                {session.completedAt && ` • Завершена ${formatDate(session.completedAt)}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="default" onClick={handleExportCSV} className="flex-1 sm:flex-none min-w-[100px] h-10 sm:h-9">
              <Download className="mr-1 sm:mr-2" size={18} />
              CSV
            </Button>
            <Button variant="outline" size="default" onClick={handleExportExcel} className="flex-1 sm:flex-none min-w-[100px] h-10 sm:h-9">
              <FileXls className="mr-1 sm:mr-2" size={18} />
              Excel
            </Button>
            {!isCompleted && (
              <Button size="default" onClick={() => setShowCompleteDialog(true)} className="flex-1 sm:flex-none min-w-[120px] h-10 sm:h-9">
                <Lock className="mr-1 sm:mr-2" size={18} />
                <span className="hidden sm:inline">Завершить</span>
                <span className="sm:hidden">Заверш.</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 py-4 sm:px-4 sm:py-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <Card className="p-3 sm:p-4 md:p-5">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="text-xs sm:text-sm text-muted-foreground">Всего</div>
              <CheckCircle size={16} className="text-muted-foreground sm:w-5 sm:h-5" />
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-mono font-bold">{summary.totalProducts}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
              {summary.scannedProducts} отскан.
            </div>
          </Card>

          <Card className="p-3 sm:p-4 md:p-5 bg-destructive/5 border-destructive/20">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="text-xs sm:text-sm font-medium text-destructive">Недост.</div>
              <TrendDown size={16} className="text-destructive sm:w-5 sm:h-5" />
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-mono font-bold text-destructive">{summary.shortageCount}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">не хватает</div>
          </Card>

          <Card className="p-3 sm:p-4 md:p-5 bg-success/5 border-success/20">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="text-xs sm:text-sm font-medium text-success">Излишки</div>
              <TrendUp size={16} className="text-success sm:w-5 sm:h-5" />
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-mono font-bold text-success">{summary.surplusCount}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">лишних</div>
          </Card>

          <Card className="p-3 sm:p-4 md:p-5 bg-warning/5 border-warning/20">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="text-xs sm:text-sm font-medium text-warning">Неизв.</div>
              <Warning size={16} className="text-warning sm:w-5 sm:h-5" />
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-mono font-bold text-warning">{summary.unknownCount}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">нет в БД</div>
          </Card>
        </div>

        <Card className="p-3 sm:p-4 md:p-6">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold">Детали расхождений</h2>
              <TabsList className="grid grid-cols-2 sm:flex w-full sm:w-auto h-auto">
                <TabsTrigger value="all" className="text-xs sm:text-sm py-2.5 sm:py-2">Все ({variances.length})</TabsTrigger>
                <TabsTrigger value="shortage" className="text-xs sm:text-sm py-2.5 sm:py-2">Недост. ({summary.shortageCount})</TabsTrigger>
                <TabsTrigger value="surplus" className="text-xs sm:text-sm py-2.5 sm:py-2">Изл. ({summary.surplusCount})</TabsTrigger>
                <TabsTrigger value="unknown" className="text-xs sm:text-sm py-2.5 sm:py-2">Неизв. ({summary.unknownCount})</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={filter} className="mt-0">
              <div className="border rounded-lg overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Штрихкод</TableHead>
                      <TableHead className="text-xs sm:text-sm min-w-[120px]">Название</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">План</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Факт</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Разн.</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm hidden sm:table-cell">Сумма</TableHead>
                      <TableHead className="text-xs sm:text-sm">Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVariances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-6 sm:py-8 text-sm">
                          Нет товаров в этой категории
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVariances.map((v, idx) => (
                        <TableRow key={idx} className={
                          v.varianceType === 'shortage' ? 'bg-destructive/5' :
                          v.varianceType === 'surplus' ? 'bg-success/5' :
                          v.varianceType === 'unknown' ? 'bg-warning/5' : ''
                        }>
                          <TableCell className="font-mono text-xs sm:text-sm">{v.barcode}</TableCell>
                          <TableCell className="font-medium text-xs sm:text-sm">{v.name}</TableCell>
                          <TableCell className="text-right font-mono text-xs sm:text-sm">{formatNumber(v.expectedQty)}</TableCell>
                          <TableCell className="text-right font-mono text-xs sm:text-sm">{formatNumber(v.actualQty)}</TableCell>
                          <TableCell className={`text-right font-mono font-bold text-xs sm:text-sm ${
                            v.variance > 0 ? 'text-success' :
                            v.variance < 0 ? 'text-destructive' : 'text-muted-foreground'
                          }`}>
                            {v.variance > 0 ? '+' : ''}{formatNumber(v.variance)}
                          </TableCell>
                          <TableCell className={`text-right font-mono text-xs sm:text-sm hidden sm:table-cell ${
                            v.varianceValue > 0 ? 'text-success' :
                            v.varianceValue < 0 ? 'text-destructive' : 'text-muted-foreground'
                          }`}>
                            {formatCurrency(v.varianceValue)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              v.varianceType === 'shortage' ? 'destructive' :
                              v.varianceType === 'surplus' ? 'default' :
                              v.varianceType === 'unknown' ? 'secondary' : 'outline'
                            } className="text-xs whitespace-nowrap">
                              {v.varianceType === 'shortage' ? 'недост.' :
                               v.varianceType === 'surplus' ? 'излиш.' :
                               v.varianceType === 'unknown' ? 'неизв.' : 'совп.'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Завершить сессию инвентаризации?</AlertDialogTitle>
            <AlertDialogDescription>
              После завершения сессии вы не сможете добавлять новые сканирования. 
              Убедитесь, что вся работа выполнена и все данные проверены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteSession}>
              Завершить сессию
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
