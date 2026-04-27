import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MapPin, Buildings, CalendarBlank, Clipboard } from '@phosphor-icons/react'
import { isInsideTelegram, showBackButton, hideBackButton } from '@/services/telegram'
import { StartInventoryDialog } from '@/components/StartInventoryDialog'
import type { Store, Company } from '@/types/api'
import type { InventorySession, ProductReference } from '@/lib/types'
import { formatDate } from '@/lib/inventory'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getStatusLabel(status: InventorySession['status']): string {
  switch (status) {
    case 'active': return 'Активна'
    case 'completed': return 'Завершена'
    case 'planned': return 'Запланирована'
  }
}

function getStatusVariant(status: InventorySession['status']): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'active': return 'default'
    case 'completed': return 'secondary'
    case 'planned': return 'outline'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface StoreDetailScreenProps {
  store: Store
  company: Company
  sessions: InventorySession[]
  onBack: () => void
  onStartInventory: (
    source: 'file' | 'manual',
    products: ProductReference[],
    importMeta?: { warehouse?: string; productCount: number },
  ) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function StoreDetailScreen({
  store,
  company,
  sessions,
  onBack,
  onStartInventory,
}: StoreDetailScreenProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const inTelegram = isInsideTelegram()

  // Manage Telegram BackButton
  useEffect(() => {
    if (inTelegram) {
      showBackButton(onBack)
      return () => hideBackButton(onBack)
    }
  }, [inTelegram, onBack])

  // Sessions linked to this store, newest first
  const storeSessions = sessions
    .filter(s => s.storeId === store.id)
    .sort((a, b) => b.createdAt - a.createdAt)

  const lastSession = storeSessions[0] ?? null

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center gap-3">
            {!inTelegram && (
              <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
                <ArrowLeft size={20} />
              </Button>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{store.name}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{company.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-4 sm:px-4 sm:py-6 space-y-6">
        {/* Store info card */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Buildings size={18} className="text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">{company.name}</span>
          </div>

          {store.address && (
            <div className="flex items-start gap-2">
              <MapPin size={18} className="text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{store.address}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Clipboard size={18} className="text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">
              Ревизий: {storeSessions.length}
            </span>
          </div>
        </div>

        {/* Last revision */}
        {lastSession && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Последняя ревизия
            </h2>
            <div className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium truncate">{lastSession.name}</span>
                <Badge variant={getStatusVariant(lastSession.status)} className="shrink-0 text-xs">
                  {getStatusLabel(lastSession.status)}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarBlank size={13} className="shrink-0" />
                <span>{formatDate(lastSession.createdAt)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Start inventory button */}
        <Button
          size="lg"
          className="w-full h-14 text-base"
          onClick={() => setDialogOpen(true)}
        >
          Начать инвентаризацию
        </Button>
      </div>

      {/* Source picker dialog */}
      <StartInventoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelect={onStartInventory}
      />
    </div>
  )
}
