import {
  FALLBACK_LANGUAGE,
  LANGUAGE_BROADCAST_KEY,
  LANGUAGE_COOKIE_KEY,
  LANGUAGE_COOKIE_MAX_AGE,
  isUILanguage,
  type UILanguage
} from '@/configs/i18nConfig'

/**
 * The chosen language lives in a cookie, which React has to treat as an external store:
 * reading it during render would break hydration, and reading it in an effect would mean
 * a cascading setState. `useSyncExternalStore` is the supported way in.
 *
 * A cookie rather than localStorage so the server can read the same value and render the
 * first paint in the right language — otherwise every load flashes English first.
 */

let cached: UILanguage | null = null

const listeners = new Set<() => void>()

const emit = () => listeners.forEach(listener => listener())

/** Parsed by hand rather than by regex: the key contains a dot. */
const readCookie = (): UILanguage | null => {
  for (const part of document.cookie.split('; ')) {
    const separator = part.indexOf('=')

    if (separator !== -1 && part.slice(0, separator) === LANGUAGE_COOKIE_KEY) {
      const value = decodeURIComponent(part.slice(separator + 1))

      return isUILanguage(value) ? value : null
    }
  }

  return null
}

const writeCookie = (next: UILanguage) => {
  document.cookie = `${LANGUAGE_COOKIE_KEY}=${next}; path=/; max-age=${LANGUAGE_COOKIE_MAX_AGE}; samesite=lax`
}

export const subscribe = (onStoreChange: () => void) => {
  listeners.add(onStoreChange)

  // Keep two tabs of the admin in step: the cookie is already shared, the write to
  // localStorage is only there to fire this event.
  const onStorage = (event: StorageEvent) => {
    if (event.key === LANGUAGE_BROADCAST_KEY) {
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
    cached = readCookie() ?? FALLBACK_LANGUAGE
  } catch {
    // Blocked storage — stay on the fallback.
    cached = FALLBACK_LANGUAGE
  }

  return cached
}

export const setStoredLanguage = (next: UILanguage) => {
  cached = next

  try {
    writeCookie(next)
    window.localStorage.setItem(LANGUAGE_BROADCAST_KEY, next)
  } catch {
    // Not persisting is survivable; the switch still works for this session.
  }

  emit()
}
