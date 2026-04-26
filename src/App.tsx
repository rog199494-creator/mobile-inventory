import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Plus } from '@phosphor-icons/react'
import { SessionCard } from '@/components/SessionCard'
import { ScannerInterface } from '@/components/ScannerInterface'
import { VarianceAnalysis } from '@/components/VarianceAnalysis'
import { NewSessionDialog } from '@/components/NewSessionDialog'
import type { InventorySession, ProductReference, ScanRecord } from '@/lib/types'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

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
      toast.success('Back online - syncing data...')
    }
    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('You are offline - scans will be saved locally')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

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
    toast.success('Session created successfully')
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
        />
        <Toaster />
      </>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Mobile Inventory</h1>
                <p className="text-muted-foreground mt-1">Professional stocktaking made simple</p>
              </div>
              <Button onClick={() => setNewSessionOpen(true)} size="lg">
                <Plus className="mr-2" size={20} />
                New Session
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Sessions</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="planned">Planned</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredSessions.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-semibold mb-2">No sessions yet</h3>
              <p className="text-muted-foreground mb-6">Create your first inventory session to get started</p>
              <Button onClick={() => setNewSessionOpen(true)}>
                <Plus className="mr-2" size={16} />
                Create Session
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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