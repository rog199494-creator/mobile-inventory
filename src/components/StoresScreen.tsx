import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ArrowCounterClockwise, WifiHigh, Bug, MapPin, Buildings, CaretRight } from '@phosphor-icons/react'
import { api } from '@/services/api'
import { isInsideTelegram } from '@/services/telegram'
import type { Company, Store, StoresResponse, PingResponse } from '@/types/api'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function groupStoresByCompany(
  companies: Company[],
  stores: Store[],
): { company: Company; stores: Store[] }[] {
  return companies.map(company => ({
    company,
    stores: stores.filter(s => s.companyId === company.id),
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface StoresScreenProps {
  onSelectStore: (store: Store, company: Company) => void
}

export function StoresScreen({ onSelectStore }: StoresScreenProps) {
  const [pingStatus, setPingStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [pingResult, setPingResult] = useState<PingResponse | null>(null)

  const [storesStatus, setStoresStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [storesData, setStoresData] = useState<StoresResponse | null>(null)
  const [storesError, setStoresError] = useState<string | null>(null)

  const inTelegram = isInsideTelegram()

  // ── Ping ────────────────────────────────────────────────────────────────────

  const handlePing = async () => {
    setPingStatus('loading')
    setPingResult(null)
    try {
      const result = await api.ping()
      setPingResult(result)
      setPingStatus('ok')
    } catch (err) {
      setPingStatus('error')
      console.error('[StoresScreen] ping error:', (err as Error).message)
    }
  }

  // ── Load stores ─────────────────────────────────────────────────────────────

  const handleLoadStores = async () => {
    setStoresStatus('loading')
    setStoresData(null)
    setStoresError(null)
    try {
      const result = await api.getStores()
      setStoresData(result)
      setStoresStatus('ok')
    } catch (err) {
      const msg = (err as Error).message
      setStoresError(msg)
      setStoresStatus('error')
    }
  }

  const grouped = storesData ? groupStoresByCompany(storesData.companies, storesData.stores) : []

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-6 space-y-6">
      {/* Environment badge */}
      <div>
        {inTelegram ? (
          <Badge variant="default" className="gap-1">
            <WifiHigh size={14} />
            Запущено в Telegram
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <Bug size={14} />
            Запущено в браузере (debug)
          </Badge>
        )}
      </div>

      {/* Ping section */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Проверка соединения</h2>
        <Button
          variant="outline"
          onClick={handlePing}
          disabled={pingStatus === 'loading'}
          className="w-full sm:w-auto"
        >
          <ArrowCounterClockwise
            size={16}
            className={pingStatus === 'loading' ? 'animate-spin mr-2' : 'mr-2'}
          />
          {pingStatus === 'loading' ? 'Проверяем...' : 'Проверить соединение'}
        </Button>

        {pingStatus === 'ok' && pingResult && (
          <Alert>
            <AlertDescription className="text-sm">
              ✅ Сервер доступен — <span className="font-medium">{pingResult.status}</span>
              {pingResult.message && ` · ${pingResult.message}`}
            </AlertDescription>
          </Alert>
        )}
        {pingStatus === 'error' && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">
              ❌ Сервер недоступен. Проверьте интернет-соединение.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Separator />

      {/* Stores section */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Список объектов</h2>
        <Button
          onClick={handleLoadStores}
          disabled={storesStatus === 'loading'}
          className="w-full sm:w-auto"
        >
          <Buildings
            size={16}
            className={storesStatus === 'loading' ? 'animate-spin mr-2' : 'mr-2'}
          />
          {storesStatus === 'loading' ? 'Загружаем...' : 'Загрузить список объектов'}
        </Button>

        {storesStatus === 'error' && storesError && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{storesError}</AlertDescription>
          </Alert>
        )}

        {storesStatus === 'loading' && (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        )}

        {storesStatus === 'ok' && grouped.length === 0 && (
          <p className="text-sm text-muted-foreground">Объектов не найдено.</p>
        )}

        {storesStatus === 'ok' && grouped.map(({ company, stores }) => (
          <div key={company.id} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {company.name}
            </h3>
            {stores.length === 0 ? (
              <p className="text-xs text-muted-foreground pl-2">Объектов нет</p>
            ) : (
              <div className="space-y-2">
                {stores.map(store => (
                  <button
                    key={store.id}
                    className="w-full text-left rounded-lg border bg-card p-3 hover:bg-accent transition-colors flex items-start gap-2"
                    onClick={() => onSelectStore(store, company)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{store.name}</div>
                      {store.address && (
                        <div className="flex items-start gap-1 mt-1">
                          <MapPin size={12} className="mt-0.5 shrink-0 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{store.address}</span>
                        </div>
                      )}
                    </div>
                    <CaretRight size={16} className="shrink-0 text-muted-foreground mt-0.5" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
