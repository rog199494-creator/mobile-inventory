import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Barcode, Users, Package } from '@phosphor-icons/react'
import type { InventorySession, SessionStatus } from '@/lib/types'
import { formatDate } from '@/lib/inventory'

interface SessionCardProps {
  session: InventorySession
  onView: (session: InventorySession) => void
  onScan: (session: InventorySession) => void
}

function getStatusColor(status: SessionStatus) {
  switch (status) {
    case 'active': return 'bg-success text-success-foreground'
    case 'completed': return 'bg-muted text-muted-foreground'
    case 'planned': return 'bg-accent text-accent-foreground'
  }
}

function getStatusLabel(status: SessionStatus) {
  switch (status) {
    case 'active': return 'Активна'
    case 'completed': return 'Завершена'
    case 'planned': return 'Запланирована'
  }
}

export function SessionCard({ session, onView, onScan }: SessionCardProps) {
  const scannedBarcodes = new Set(session.scans.map(s => s.barcode))
  const progress = session.products.length > 0 
    ? (scannedBarcodes.size / session.products.length) * 100 
    : 0
  const totalScanned = session.scans.reduce((sum, s) => sum + s.actualQty, 0)

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">{session.name}</h3>
          <p className="text-sm text-muted-foreground">{session.storeName}</p>
        </div>
        <Badge className={getStatusColor(session.status)}>
          {getStatusLabel(session.status)}
        </Badge>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Package className="text-muted-foreground" size={16} />
          <span className="font-mono">{session.products.length}</span>
          <span className="text-muted-foreground">товаров</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Barcode className="text-muted-foreground" size={16} />
          <span className="font-mono">{totalScanned}</span>
          <span className="text-muted-foreground">отсканировано</span>
        </div>

        {session.status !== 'planned' && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Прогресс</span>
              <span className="font-mono font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground mb-4">
        Создана {formatDate(session.createdAt)}
      </div>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => onView(session)}
        >
          Подробнее
        </Button>
        {(session.status === 'active' || session.status === 'planned') && (
          <Button 
            className="flex-1"
            onClick={() => onScan(session)}
          >
            <Barcode className="mr-2" size={16} />
            Сканировать
          </Button>
        )}
      </div>
    </Card>
  )
}
