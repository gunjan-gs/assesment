import { describe, it, expect, vi } from 'vitest';
import { GridStore } from './store';
// import type { GridState } from './types';

describe('GridStore', () => {
  it('should initialize with default state', () => {
    const store = new GridStore();
    const state = store.getState();
    expect(state.rowMap.size).toBe(0);
    expect(state.scrollTop).toBe(0);
  });

  it('should update state immutably', () => {
    const store = new GridStore();
    const initialState = store.getState();
    
    store.setState((prev) => ({
      ...prev,
      scrollTop: 100
    }));

    const newState = store.getState();
    expect(newState).not.toBe(initialState);
    expect(newState.scrollTop).toBe(100);
    expect(initialState.scrollTop).toBe(0); // Ensure old state wasn't mutated
  });

  it('should notify subscribers', () => {
    const store = new GridStore();
    const listener = vi.fn();
    
    const unsubscribe = store.subscribe(listener);
    
    store.setState((prev) => ({ ...prev, scrollTop: 50 }));
    
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ scrollTop: 50 }));
    
    unsubscribe();
    store.setState((prev) => ({ ...prev, scrollTop: 100 }));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
