import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Camera, X } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  isActive: boolean
  onToggle: () => void
}

export function BarcodeScanner({ onScan, isActive, onToggle }: BarcodeScannerProps) {
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const elementId = 'barcode-scanner-view'

  useEffect(() => {
    if (isActive && !scanner) {
      initScanner()
    } else if (!isActive && scanner) {
      stopScanner()
    }

    return () => {
      if (scannerRef.current) {
        stopScanner()
      }
    }
  }, [isActive])

  const initScanner = async () => {
    try {
      setError(null)
      const html5QrCode = new Html5Qrcode(elementId)
      scannerRef.current = html5QrCode
      setScanner(html5QrCode)

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16
        ]
      }

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          onScan(decodedText)
          setIsScanning(true)
          setTimeout(() => setIsScanning(false), 300)
        },
        () => {
        }
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Не удалось запустить камеру'
      setError(errorMessage)
      toast.error('Ошибка доступа к камере')
      console.error('Scanner initialization error:', err)
    }
  }

  const stopScanner = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      }
      scannerRef.current = null
      setScanner(null)
      setError(null)
    } catch (err) {
      console.error('Error stopping scanner:', err)
    }
  }

  if (!isActive) {
    return (
      <Button
        className="w-full h-14 text-lg"
        onClick={onToggle}
        variant="secondary"
      >
        <Camera className="mr-2" size={24} />
        Открыть камеру для сканирования
      </Button>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <div 
          id={elementId}
          className={`w-full ${isScanning ? 'ring-4 ring-success ring-offset-2' : ''} transition-all`}
        />
        
        {error && (
          <div className="absolute inset-0 bg-destructive/10 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="text-center">
              <p className="text-destructive font-semibold mb-2">Ошибка камеры</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        <div className="absolute top-2 right-2 z-10">
          <Button
            size="icon"
            variant="destructive"
            onClick={onToggle}
            className="rounded-full shadow-lg"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="absolute bottom-2 left-0 right-0 text-center">
          <div className="inline-block bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full">
            <p className="text-sm font-medium">
              {isScanning ? '✓ Отсканировано!' : 'Наведите камеру на штрихкод'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
