import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Download, TrendUp, TrendDown, Warning, CheckCircle } from '@phosphor-icons/react'
import type { InventorySession, VarianceItem } from '@/lib/types'
import { calculateVariances, calculateSummary, generateExcelCSV, downloadCSV, formatNumber, formatCurrency, formatDate } from '@/lib/inventory'

interface VarianceAnalysisProps {
  session: InventorySession
  onBack: () => void
}

export function VarianceAnalysis({ session, onBack }: VarianceAnalysisProps) {
  const [filter, setFilter] = useState<'all' | 'shortage' | 'surplus' | 'unknown'>('all')
  
  const variances = useMemo(() => calculateVariances(session), [session])
  const summary = useMemo(() => calculateSummary(variances), [variances])

  const filteredVariances = useMemo(() => {
    if (filter === 'all') return variances
    return variances.filter(v => v.varianceType === filter)
  }, [variances, filter])

  const handleExport = () => {
    const csv = generateExcelCSV(variances)
    downloadCSV(csv, `inventory-${session.name}-${Date.now()}.csv`)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="outline" onClick={onBack} className="mb-4">
              ← Back
            </Button>
            <h1 className="text-3xl font-bold">{session.name}</h1>
            <p className="text-muted-foreground">{session.storeName}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Created {formatDate(session.createdAt)}
            </p>
          </div>
          <Button onClick={handleExport}>
            <Download className="mr-2" size={16} />
            Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Total Products</div>
              <CheckCircle size={20} className="text-muted-foreground" />
            </div>
            <div className="text-3xl font-mono font-bold">{summary.totalProducts}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {summary.scannedProducts} scanned
            </div>
          </Card>

          <Card className="p-6 bg-destructive/5 border-destructive/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-destructive">Shortage</div>
              <TrendDown size={20} className="text-destructive" />
            </div>
            <div className="text-3xl font-mono font-bold text-destructive">{summary.shortageCount}</div>
            <div className="text-sm text-muted-foreground mt-1">items missing</div>
          </Card>

          <Card className="p-6 bg-success/5 border-success/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-success">Surplus</div>
              <TrendUp size={20} className="text-success" />
            </div>
            <div className="text-3xl font-mono font-bold text-success">{summary.surplusCount}</div>
            <div className="text-sm text-muted-foreground mt-1">extra items</div>
          </Card>

          <Card className="p-6 bg-warning/5 border-warning/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-warning">Unknown</div>
              <Warning size={20} className="text-warning" />
            </div>
            <div className="text-3xl font-mono font-bold text-warning">{summary.unknownCount}</div>
            <div className="text-sm text-muted-foreground mt-1">not in system</div>
          </Card>
        </div>

        <Card className="p-6">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Variance Details</h2>
              <TabsList>
                <TabsTrigger value="all">All ({variances.length})</TabsTrigger>
                <TabsTrigger value="shortage">Shortage ({summary.shortageCount})</TabsTrigger>
                <TabsTrigger value="surplus">Surplus ({summary.surplusCount})</TabsTrigger>
                <TabsTrigger value="unknown">Unknown ({summary.unknownCount})</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={filter} className="mt-0">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Barcode</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead className="text-right">Expected</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVariances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No items in this category
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
                              {v.varianceType}
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
    </div>
  )
}
