import { createContext, useContext } from 'react';
import { GridStore } from '../../core/store';

export interface GridContextType<T = unknown> {
  store: GridStore<T>;
  // Add other shared context props here if needed
}

export const GridContext = createContext<GridContextType<unknown> | null>(null);

export interface GridConfig {
  onCellEdit?: (params: { rowId: string | number, colId: string, value: unknown }) => Promise<void> | void;
}

export const GridConfigContext = createContext<GridConfig | null>(null);

export function useStore<T = unknown>() {
  const context = useContext(GridContext);
  if (!context) {
    throw new Error('DataGrid components must be wrapped in <DataGrid>');
  }
  return context.store as GridStore<T>;
}

export function useGridConfig() {
  return useContext(GridConfigContext) || {};
}
