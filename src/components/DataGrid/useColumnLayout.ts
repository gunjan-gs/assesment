import { useMemo } from 'react';
import { useStore } from './context';
import { useGridSelector } from '../../core/hooks';
import { ColumnVirtualizer } from '../../core/virtual';

export function useColumnLayout(viewportWidth: number) {
  const store = useStore();
  const scrollLeft = useGridSelector(store, state => state.scrollLeft);
  const columnOrder = useGridSelector(store, state => state.columnOrder);
  const columnWidths = useGridSelector(store, state => state.columnWidths);
  const columnVisibility = useGridSelector(store, state => state.columnVisibility);
  const pinnedColumns = useGridSelector(store, state => state.pinnedColumns);

  return useMemo(() => {
    return ColumnVirtualizer.calculateLayout({
      columnOrder,
      columnWidths,
      columnVisibility,
      pinnedColumns,
      scrollLeft,
      viewportWidth,
      overscan: 300 // pixel buffer
    });
  }, [columnOrder, columnWidths, columnVisibility, pinnedColumns, scrollLeft, viewportWidth]);
}
