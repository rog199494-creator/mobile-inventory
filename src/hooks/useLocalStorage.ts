import { useState } from 'react'

/**
 * Drop-in replacement for useKV from @github/spark/hooks that persists to localStorage.
 * State is loaded synchronously from localStorage on mount and written on every update.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T | null, (value: T | null | ((prev: T | null) => T | null)) => void] {
  const [storedValue, setStoredValue] = useState<T | null>(() => {
    try {
      const item = localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value: T | null | ((prev: T | null) => T | null)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (valueToStore === null) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`[localStorage] Error saving key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}
