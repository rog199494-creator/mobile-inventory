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
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="outline" onClick={onBack} className="mb-4">
              ← Назад
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{session.name}</h1>
              {isCompleted && (
                <Badge className="bg-muted text-muted-foreground">
                  <Lock className="mr-1" size={14} />
                  Завершена
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{session.storeName}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Создана {formatDate(session.createdAt)}
              {session.completedAt && ` • Завершена ${formatDate(session.completedAt)}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2" size={16} />
              CSV
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <FileXls className="mr-2" size={16} />
              Excel
            </Button>
            {!isCompleted && (
              <Button onClick={() => setShowCompleteDialog(true)}>
                <Lock className="mr-2" size={16} />
                Завершить сессию
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Всего товаров</div>
              <CheckCircle size={20} className="text-muted-foreground" />
            </div>
            <div className="text-3xl font-mono font-bold">{summary.totalProducts}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {summary.scannedProducts} отсканировано
            </div>
          </Card>

          <Card className="p-6 bg-destructive/5 border-destructive/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-destructive">Недостача</div>
              <TrendDown size={20} className="text-destructive" />
            </div>
            <div className="text-3xl font-mono font-bold text-destructive">{summary.shortageCount}</div>
            <div className="text-sm text-muted-foreground mt-1">товаров не хватает</div>
          </Card>

          <Card className="p-6 bg-success/5 border-success/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-success">Излишки</div>
              <TrendUp size={20} className="text-success" />
            </div>
            <div className="text-3xl font-mono font-bold text-success">{summary.surplusCount}</div>
            <div className="text-sm text-muted-foreground mt-1">лишних товаров</div>
          </Card>

          <Card className="p-6 bg-warning/5 border-warning/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-warning">Неизвестные</div>
              <Warning size={20} className="text-warning" />
            </div>
            <div className="text-3xl font-mono font-bold text-warning">{summary.unknownCount}</div>
            <div className="text-sm text-muted-foreground mt-1">нет в системе</div>
          </Card>
        </div>

        <Card className="p-6">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Детали расхождений</h2>
              <TabsList>
                <TabsTrigger value="all">Все ({variances.length})</TabsTrigger>
                <TabsTrigger value="shortage">Недостача ({summary.shortageCount})</TabsTrigger>
                <TabsTrigger value="surplus">Излишки ({summary.surplusCount})</TabsTrigger>
                <TabsTrigger value="unknown">Неизв. ({summary.unknownCount})</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={filter} className="mt-0">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Штрихкод</TableHead>
                      <TableHead>Название</TableHead>
                      <TableHead className="text-right">План</TableHead>
                      <TableHead className="text-right">Факт</TableHead>
                      <TableHead className="text-right">Разница</TableHead>
                      <TableHead className="text-right">Сумма</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVariances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                          <TableCell className="font-mono text-sm">{v.barcode}</TableCell>
                          <TableCell className="font-medium">{v.name}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(v.expectedQty)}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(v.actualQty)}</TableCell>
                          <TableCell className={`text-right font-mono font-bold ${
                            v.variance > 0 ? 'text-success' :
                            v.variance < 0 ? 'text-destructive' : 'text-muted-foreground'
                          }`}>
                            {v.variance > 0 ? '+' : ''}{formatNumber(v.variance)}
                          </TableCell>
                          <TableCell className={`text-right font-mono ${
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
                            }>
                              {v.varianceType === 'shortage' ? 'недостача' :
                               v.varianceType === 'surplus' ? 'излишки' :
                               v.varianceType === 'unknown' ? 'неизвестно' : 'совпадение'}
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
