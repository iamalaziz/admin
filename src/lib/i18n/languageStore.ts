import { FALLBACK_LANGUAGE, LANGUAGE_STORAGE_KEY, isUILanguage, type UILanguage } from '@/configs/i18nConfig'

/**
 * The chosen language lives in localStorage, which React has to treat as an external
 * store: reading it during render would break hydration, and reading it in an effect
 * would mean a cascading setState. `useSyncExternalStore` is the supported way in.
 */

let cached: UILanguage | null = null

const listeners = new Set<() => void>()

const emit = () => listeners.forEach(listener => listener())

export const subscribe = (onStoreChange: () => void) => {
  listeners.add(onStoreChange)

  // Keep two tabs of the admin in step.
  const onStorage = (event: StorageEvent) => {
    if (event.key === LANGUAGE_STORAGE_KEY) {
      cached = isUILanguage(event.newValue) ? event.newValue : FALLBACK_LANGUAGE
      onStoreChange()
    }
  }

  window.addEventListener('storage', onStorage)

  return () => {
    listeners.delete(onStoreChange)
    window.removeEventListener('storage', onStorage)
  }
}

export const getSnapshot = (): UILanguage => {
  if (cached !== null) {
    return cached
  }

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)

    cached = isUILanguage(stored) ? stored : FALLBACK_LANGUAGE
  } catch {
    // Private mode or blocked storage — stay on the fallback.
    cached = FALLBACK_LANGUAGE
  }

  return cached
}

/** The server has no storage to read, so it always renders the fallback language. */
export const getServerSnapshot = (): UILanguage => FALLBACK_LANGUAGE

export const setStoredLanguage = (next: UILanguage) => {
  cached = next

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
  } catch {
    // Not persisting is survivable; the switch still works for this session.
  }

  emit()
}
