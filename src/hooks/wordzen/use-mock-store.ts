'use client'

import { useMemo, useSyncExternalStore } from 'react'

import { mockStore } from '@/fake-db/wordzen/store'

/**
 * Subscribes to the mock store's version counter.
 *
 * Reads go straight through the store's getters, which build a fresh array each call;
 * returning one of those from `getSnapshot` would hand `useSyncExternalStore` a new
 * reference on every render and loop. A monotonic number is a stable snapshot, so
 * callers derive their data from it instead — see `useStoreSelector`.
 *
 * The server snapshot is the same getter: the fixtures are seeded, so a freshly
 * constructed store on the server holds exactly what the client's does at version 0.
 */
export const useStoreVersion = (): number =>
  useSyncExternalStore(mockStore.subscribe, mockStore.getVersion, mockStore.getVersion)

/**
 * Reads derived data out of the store, recomputing whenever the store commits a change.
 *
 * `version` is the entire point of the dependency list: the selector reads mutable state
 * that React cannot observe, so the counter is what tells the memo to run again. The lint
 * rule only sees that `version` is never referenced inside the selector body and calls it
 * redundant, which is why the exhaustive-deps check is suppressed here — once, rather than
 * at each of the two dozen call sites.
 */
export function useStoreSelector<T>(selector: () => T, extraDeps: readonly (string | number)[] = []): T {
  const version = useStoreVersion()

  // Joined into one key because the dependency list has to be a literal array: the ids
  // callers pass (a course, module or user id) are all primitives, so this is stable.
  const depsKey = extraDeps.join('|')

  // `selector` is intentionally absent from the deps: it is a fresh closure on every
  // render, so depending on it would recompute every time and memoize nothing.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => selector(), [version, depsKey])
}

export { mockStore }
