import { useSyncExternalStore, useCallback } from 'react';
import { GridStore } from './store';
import type { GridState } from './types';

export function useGridSelector<T, R>(
  store: GridStore<T>,
  selector: (state: GridState<T>) => R
): R {
  const getSnapshot = useCallback(() => selector(store.getState()), [store, selector]);
  
  // We need a stable version of selector result to avoid unnecessary re-renders if selector returns new object reference
  // But useSyncExternalStore does check for equality. 
  // However, if the selector returns a new object every time (like map()), it will loop.
  // Ideally, selectors should be memoized or primitive.
  
  return useSyncExternalStore(
    store.subscribe,
    getSnapshot,
    getSnapshot // Server snapshot (same for now)
  );
}
