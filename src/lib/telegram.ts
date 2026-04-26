export interface StoreData {
  id: string
  name: string
  address?: string
}

export async function fetchStores(): Promise<StoreData[]> {
  try {
    const response = await fetch('https://miniapp.bitrixabd.ru/stores')
    if (!response.ok) {
      throw new Error('Failed to fetch stores')
    }
    const data = await response.json()
    return data as StoreData[]
  } catch (error) {
    console.error('Error fetching stores:', error)
    return []
  }
}

export function getTelegramWebApp() {
  return (window as any).Telegram?.WebApp || null
}

export function isTelegramWebApp(): boolean {
  return !!(window as any).Telegram?.WebApp
}

export function openStoreSelectionApp(miniAppUrl: string): Promise<StoreData | null> {
  return new Promise((resolve) => {
    const webApp = getTelegramWebApp()
    
    if (!webApp) {
      resolve(null)
      return
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'store_selected' && event.data?.store) {
        window.removeEventListener('message', handleMessage)
        resolve(event.data.store as StoreData)
      }
    }

    window.addEventListener('message', handleMessage)

    setTimeout(() => {
      window.removeEventListener('message', handleMessage)
      resolve(null)
    }, 30000)

    if (webApp.openTelegramLink) {
      webApp.openTelegramLink(miniAppUrl)
    } else if (webApp.openLink) {
      webApp.openLink(miniAppUrl)
    }
  })
}

export function sendStoreData(store: StoreData) {
  if (window.opener) {
    window.opener.postMessage({
      type: 'store_selected',
      store
    }, '*')
  }
  
  const webApp = getTelegramWebApp()
  if (webApp) {
    webApp.close()
  }
}

export function getStartParam(): string | null {
  const webApp = getTelegramWebApp()
  if (!webApp) return null
  
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('tgWebAppStartParam')
}

export function parseStoreFromStartParam(startParam: string | null): StoreData | null {
  if (!startParam) return null
  
  try {
    const decoded = atob(startParam)
    return JSON.parse(decoded) as StoreData
  } catch {
    return null
  }
}

export function encodeStoreToStartParam(store: StoreData): string {
  const json = JSON.stringify(store)
  return btoa(json)
}
