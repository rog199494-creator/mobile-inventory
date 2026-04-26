import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Info } from '@phosphor-icons/react'
import { SessionCard } from '@/components/SessionCard'
import { ScannerInterface } from '@/components/ScannerInterface'
import { VarianceAnalysis } from '@/components/VarianceAnalysis'
import { NewSessionDialog } from '@/components/NewSessionDialog'
import { ProcessGuide } from '@/components/ProcessGuide'
import type { InventorySession, ProductReference, ScanRecord } from '@/lib/types'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type View = 'dashboard' | 'scanner' | 'analysis'

function App() {
  const [sessions, setSessions] = useKV<InventorySession[]>('inventory-sessions', [])
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [selectedSession, setSelectedSession] = useState<InventorySession | null>(null)
  const [newSessionOpen, setNewSessionOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingScans, setPendingScans] = useState(0)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'planned' | 'completed'>('all')

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Связь восстановлена - синхронизация данных...')
    }
    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('Вы работаете оффлайн - сканирования сохраняются локально')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready()
      window.Telegram.WebApp.expand()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleCreateSession = (name: string, storeName: string, products: ProductReference[]) => {
    const newSession: InventorySession = {
      id: uuidv4(),
      name,
      storeName,
      status: 'planned',
      createdAt: Date.now(),
      products,
      scans: []
    }

    setSessions(current => [...(current || []), newSession])
    toast.success('Сессия создана успешно')
  }

  const handleViewSession = (session: InventorySession) => {
    setSelectedSession(session)
    setCurrentView('analysis')
  }

  const handleStartScanning = (session: InventorySession) => {
    if (session.status === 'planned') {
      setSessions(current => 
        (current || []).map(s => 
          s.id === session.id ? { ...s, status: 'active' as const, startedAt: Date.now() } : s
        )
      )
    }
    
    setSelectedSession((sessions || []).find(s => s.id === session.id) || session)
    setCurrentView('scanner')
  }

  const handleScan = (barcode: string, quantity: number) => {
    if (!selectedSession) return

    const scanRecord: ScanRecord = {
      id: uuidv4(),
      barcode,
      actualQty: quantity,
      scannedAt: Date.now(),
      scannedBy: 'user',
      isSynced: isOnline
    }

    setSessions(current => 
      (current || []).map(s => {
        if (s.id === selectedSession.id) {
          const existingIndex = s.scans.findIndex(scan => scan.barcode === barcode)
          if (existingIndex !== -1) {
            const updatedScans = [...s.scans]
            updatedScans[existingIndex] = {
              ...updatedScans[existingIndex],
              actualQty: updatedScans[existingIndex].actualQty + quantity
            }
            return { ...s, scans: updatedScans }
          }
          return { ...s, scans: [...s.scans, scanRecord] }
        }
        return s
      })
    )

    const updatedSession = (sessions || []).find(s => s.id === selectedSession.id)
    if (updatedSession) {
      setSelectedSession({
        ...updatedSession,
        scans: [...(updatedSession.scans || []), scanRecord]
      })
    }

    if (!isOnline) {
      setPendingScans(prev => prev + 1)
    }
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
    setSelectedSession(null)
  }

  const handleCompleteSession = (sessionId: string) => {
    setSessions(current =>
      (current || []).map(s =>
        s.id === sessionId ? { ...s, status: 'completed' as const, completedAt: Date.now() } : s
      )
    )
  }

  const filteredSessions = (sessions || []).filter(s => 
    statusFilter === 'all' || s.status === statusFilter
  )

  if (currentView === 'scanner' && selectedSession) {
    const currentSession = (sessions || []).find(s => s.id === selectedSession.id) || selectedSession
    return (
      <>
        <ScannerInterface
          session={currentSession}
          onScan={handleScan}
          onBack={handleBackToDashboard}
          isOnline={isOnline}
          pendingScans={pendingScans}
        />
        <Toaster />
      </>
    )
  }

  if (currentView === 'analysis' && selectedSession) {
    const currentSession = (sessions || []).find(s => s.id === selectedSession.id) || selectedSession
    return (
      <>
        <VarianceAnalysis
          session={currentSession}
          onBack={handleBackToDashboard}
          onComplete={handleCompleteSession}
        />
        <Toaster />
      </>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-background pb-safe">
        <div className="border-b bg-card sticky top-0 z-10 shadow-sm">
          <div className="px-3 py-3 sm:px-4 sm:py-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">Мобильная инвентаризация</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">Профессиональная инвентаризация стала проще</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-2 shrink-0">
                      <Info size={18} />
                      <span className="hidden sm:inline ml-2">Как работает</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-2xl">Пошаговая инструкция</DialogTitle>
                    </DialogHeader>
                    <ProcessGuide />
                  </DialogContent>
                </Dialog>
              </div>
              <Button onClick={() => setNewSessionOpen(true)} size="default" className="w-full sm:w-auto">
                <Plus className="mr-2" size={20} />
                Новая сессия
              </Button>
            </div>
          </div>
        </div>

        <div className="px-3 py-4 sm:px-4 sm:py-6">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)} className="mb-4 sm:mb-6">
            <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm py-2">Все</TabsTrigger>
              <TabsTrigger value="active" className="text-xs sm:text-sm py-2">Активные</TabsTrigger>
              <TabsTrigger value="planned" className="text-xs sm:text-sm py-2">Планы</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs sm:text-sm py-2">Готово</TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="text-5xl sm:text-6xl mb-4">📦</div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-2">Пока нет сессий</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">Создайте первую сессию инвентаризации для начала работы</p>
              <Button onClick={() => setNewSessionOpen(true)} size="lg" className="w-full sm:w-auto">
                <Plus className="mr-2" size={16} />
                Создать сессию
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {filteredSessions.map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onView={handleViewSession}
                  onScan={handleStartScanning}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <NewSessionDialog
        open={newSessionOpen}
        onOpenChange={setNewSessionOpen}
        onCreate={handleCreateSession}
      />

      <Toaster />
    </>
  )
}

export default App