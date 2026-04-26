import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload } from '@phosphor-icons/react'
import { parseExcelData } from '@/lib/inventory'
import type { ProductReference } from '@/lib/types'
import { toast } from 'sonner'

interface NewSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, storeName: string, products: ProductReference[]) => void
}

export function NewSessionDialog({ open, onOpenChange, onCreate }: NewSessionDialogProps) {
  const [name, setName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [products, setProducts] = useState<ProductReference[]>([])
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    const text = await file.text()
    try {
      const parsed = parseExcelData(text)
      setProducts(parsed)
      toast.success(`Loaded ${parsed.length} products from file`)
    } catch (error) {
      toast.error('Error parsing file. Please check the format.')
    }
  }

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('Please enter a session name')
      return
    }
    if (!storeName.trim()) {
      toast.error('Please enter a store name')
      return
    }
    if (products.length === 0) {
      toast.error('Please upload a product list')
      return
    }

    onCreate(name, storeName, products)
    
    setName('')
    setStoreName('')
    setProducts([])
    setFileName('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">New Inventory Session</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="session-name">Session Name</Label>
            <Input
              id="session-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Monthly Inventory - Jan 2024"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="store-name">Store/Location</Label>
            <Input
              id="store-name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Main Warehouse"
              className="mt-2"
            />
          </div>

          <div>
            <Label>Product List (CSV/Excel)</Label>
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border-dashed"
              >
                <div className="text-center">
                  <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
                  <div className="text-sm">
                    {fileName || 'Click to upload CSV'}
                  </div>
                  {products.length > 0 && (
                    <div className="text-xs text-success mt-1">
                      {products.length} products loaded
                    </div>
                  )}
                </div>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Format: Barcode, Name, Expected Qty, Price
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>
            Create Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
