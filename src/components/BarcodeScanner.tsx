import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { X, Lightbulb, LightbulbFilament, MagnifyingGlassMinus, MagnifyingGlassPlus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useKV } from '@github/spark/hooks'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  isActive: boolean
  onToggle: () => void
}

type FlashlightMode = 'auto' | 'on' | 'off'
type ScanMode = 'standard' | 'wide' | 'precise'

export function BarcodeScanner({ onScan, isActive, onToggle }: BarcodeScannerProps) {
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flashlightMode, setFlashlightMode] = useKV<FlashlightMode>('flashlight-mode', 'auto')
  const [isFlashlightOn, setIsFlashlightOn] = useState(false)
  const [brightness, setBrightness] = useState(100)
  const [zoomLevel, setZoomLevel] = useState(2)
  const [maxZoom, setMaxZoom] = useState(3)
  const [scanMode, setScanMode] = useKV<ScanMode>('scan-mode', 'standard')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const videoTrackRef = useRef<MediaStreamTrack | null>(null)
  const elementId = 'barcode-scanner-view'
  const brightnessCheckInterval = useRef<number | null>(null)
  const lastScanTime = useRef<number>(0)
  const lastScannedCode = useRef<string>('')
  const scanCooldown = 1000

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
      if (brightnessCheckInterval.current) {
        clearInterval(brightnessCheckInterval.current)
      }
    }
  }, [isActive])

  useEffect(() => {
    if (flashlightMode === 'on' && isActive) {
      enableFlashlight()
    } else if (flashlightMode === 'off' && isActive) {
      disableFlashlight()
    }
  }, [flashlightMode, isActive])

  useEffect(() => {
    if (flashlightMode === 'auto' && isActive) {
      if (brightness < 50) {
        enableFlashlight()
      } else if (brightness > 70) {
        disableFlashlight()
      }
    }
  }, [brightness, flashlightMode, isActive])

  useEffect(() => {
    if (videoTrackRef.current && zoomLevel) {
      applyZoom(zoomLevel)
    }
  }, [zoomLevel])

  useEffect(() => {
    if (isActive && scanner) {
      stopScanner().then(() => {
        setTimeout(() => initScanner(), 100)
      })
    }
  }, [scanMode])

  const checkBrightness = () => {
    const videoElement = document.querySelector(`#${elementId} video`) as HTMLVideoElement
    if (!videoElement) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    ctx.drawImage(videoElement, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    let totalBrightness = 0

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const brightness = (r + g + b) / 3
      totalBrightness += brightness
    }

    const avgBrightness = (totalBrightness / (data.length / 4) / 255) * 100
    setBrightness(Math.round(avgBrightness))
  }

  const applyZoom = async (zoom: number) => {
    try {
      if (videoTrackRef.current) {
        const capabilities = videoTrackRef.current.getCapabilities() as any
        if (capabilities.zoom) {
          await videoTrackRef.current.applyConstraints({
            advanced: [{ zoom } as any]
          })
        }
      }
    } catch (err) {
      console.error('Zoom apply error:', err)
    }
  }

  const getScanBoxSize = () => {
    switch (scanMode) {
      case 'wide':
        return { width: 300, height: 200 }
      case 'precise':
        return { width: 200, height: 150 }
      default:
        return { width: 250, height: 250 }
    }
  }

  const enableFlashlight = async () => {
    try {
      if (videoTrackRef.current) {
        const capabilities = videoTrackRef.current.getCapabilities() as any
        if (capabilities.torch) {
          await videoTrackRef.current.applyConstraints({
            advanced: [{ torch: true } as any]
          })
          setIsFlashlightOn(true)
        }
      }
    } catch (err) {
      console.error('Flashlight enable error:', err)
    }
  }

  const disableFlashlight = async () => {
    try {
      if (videoTrackRef.current) {
        const capabilities = videoTrackRef.current.getCapabilities() as any
        if (capabilities.torch) {
          await videoTrackRef.current.applyConstraints({
            advanced: [{ torch: false } as any]
          })
          setIsFlashlightOn(false)
        }
      }
    } catch (err) {
      console.error('Flashlight disable error:', err)
    }
  }

  const initScanner = async () => {
    try {
      setError(null)
      const html5QrCode = new Html5Qrcode(elementId)
      scannerRef.current = html5QrCode
      setScanner(html5QrCode)

      const scanBox = getScanBoxSize()
      const config = {
        fps: 30,
        qrbox: scanBox,
        aspectRatio: scanMode === 'wide' ? 1.5 : 1.0,
        formatsToSupport: [
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16
        ],
        disableFlip: false
      }

      await html5QrCode.start(
        { 
          facingMode: 'environment'
        },
        config,
        (decodedText) => {
          const now = Date.now()
          if (now - lastScanTime.current < scanCooldown || lastScannedCode.current === decodedText) {
            return
          }
          lastScanTime.current = now
          lastScannedCode.current = decodedText
          
          setTimeout(() => {
            lastScannedCode.current = ''
          }, scanCooldown)
          
          onScan(decodedText)
          setIsScanning(true)
          setTimeout(() => setIsScanning(false), 300)
        },
        () => {
        }
      )

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      })
      const videoTrack = stream.getVideoTracks()[0]
      videoTrackRef.current = videoTrack

      const capabilities = videoTrack.getCapabilities() as any
      if (capabilities.zoom) {
        setMaxZoom(capabilities.zoom?.max || 3)
        const initialZoom = Math.min(2, capabilities.zoom?.max || 2)
        setZoomLevel(initialZoom)
        await applyZoom(initialZoom)
      }

      try {
        await videoTrack.applyConstraints({
          advanced: [
            { focusMode: 'continuous' } as any,
            { exposureMode: 'continuous' } as any,
            { whiteBalanceMode: 'continuous' } as any
          ]
        })
      } catch (e) {
        console.log('Advanced constraints not supported', e)
      }

      brightnessCheckInterval.current = window.setInterval(checkBrightness, 1000)

      if (flashlightMode === 'on') {
        setTimeout(() => enableFlashlight(), 500)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Не удалось запустить камеру'
      setError(errorMessage)
      toast.error('Ошибка доступа к камере')
      console.error('Scanner initialization error:', err)
    }
  }

  const stopScanner = async () => {
    try {
      if (brightnessCheckInterval.current) {
        clearInterval(brightnessCheckInterval.current)
        brightnessCheckInterval.current = null
      }

      if (videoTrackRef.current) {
        videoTrackRef.current.stop()
        videoTrackRef.current = null
      }

      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      }
      scannerRef.current = null
      setScanner(null)
      setError(null)
      setIsFlashlightOn(false)
    } catch (err) {
      console.error('Error stopping scanner:', err)
    }
  }

  if (!isActive) {
    return null
  }

  return (
    <div className="h-full w-full relative bg-background">
      <div className="relative h-full">
        <div 
          id={elementId}
          className={`w-full h-full ${isScanning ? 'ring-4 ring-success ring-offset-2' : ''} transition-all`}
        />
        
        {error && (
          <div className="absolute inset-0 bg-destructive/10 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="text-center">
              <p className="text-destructive font-semibold mb-2">Ошибка камеры</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1.5 sm:px-3 sm:py-2">
            {isFlashlightOn ? (
              <LightbulbFilament size={18} className="text-warning" weight="fill" />
            ) : (
              <Lightbulb size={18} className="text-muted-foreground" />
            )}
            <Select value={flashlightMode} onValueChange={(v) => setFlashlightMode(v as FlashlightMode)}>
              <SelectTrigger className="w-[100px] sm:w-[120px] h-7 sm:h-8 text-xs sm:text-sm border-0 bg-transparent focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Авто</SelectItem>
                <SelectItem value="on">Включён</SelectItem>
                <SelectItem value="off">Выключен</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            size="icon"
            variant="destructive"
            onClick={onToggle}
            className="rounded-full shadow-lg h-8 w-8 sm:h-10 sm:w-10"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="absolute top-12 sm:top-14 left-2 right-2 z-10 flex items-center justify-between gap-2">
          <div className="bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 w-full">
            <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
              <label className="text-[10px] sm:text-xs font-medium text-foreground">Режим:</label>
              <Select value={scanMode} onValueChange={(v) => setScanMode(v as ScanMode)}>
                <SelectTrigger className="h-6 sm:h-7 text-[10px] sm:text-xs border-0 bg-transparent focus:ring-0 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Стандартный</SelectItem>
                  <SelectItem value="wide">Широкий</SelectItem>
                  <SelectItem value="precise">Точный</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2">
              <MagnifyingGlassMinus size={14} className="text-muted-foreground shrink-0" />
              <Slider
                value={[zoomLevel]}
                onValueChange={(v) => setZoomLevel(v[0])}
                min={1}
                max={maxZoom}
                step={0.1}
                className="flex-1"
              />
              <MagnifyingGlassPlus size={14} className="text-muted-foreground shrink-0" />
              <span className="text-[10px] sm:text-xs font-mono text-muted-foreground w-7 sm:w-8 text-right">{zoomLevel.toFixed(1)}x</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-2 left-0 right-0 text-center">
          <div className="inline-block bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full">
            <p className="text-sm font-medium">
              {isScanning ? '✓ Отсканировано!' : 'Наведите камеру на штрихкод'}
            </p>
          </div>
        </div>

        {flashlightMode === 'auto' && (
          <div className="absolute bottom-14 left-0 right-0 text-center">
            <div className="inline-block bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
              <p className="text-xs text-muted-foreground">
                Освещённость: {brightness}%
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
