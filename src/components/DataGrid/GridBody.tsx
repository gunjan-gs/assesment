import { useMemo } from 'react';
import { useStore } from './context';
import { useGridSelector } from '../../core/hooks';
import { Virtualizer } from '../../core/virtual';
import { useColumnLayout } from './useColumnLayout';
import { GridRow } from './GridRow';
import { ROW_HEIGHT, OVERSCAN_COUNT } from '../../core/constants';

interface GridBodyProps {
  viewportWidth: number;
  viewportHeight: number;
}

export function GridBody({ viewportWidth, viewportHeight }: GridBodyProps) {
  const store = useStore();
  const rowOrder = useGridSelector(store, state => state.rowOrder);
  const scrollTop = useGridSelector(store, state => state.scrollTop);
  
  // Column Layout
  const { virtualColumns, totalWidth } = useColumnLayout(
    viewportWidth
  );

  // Create virtualizer instance for Rows
  const virtualizer = useMemo(() => new Virtualizer({
    count: 0,
    getScrollOffset: () => 0,
    getContainerSize: () => 0,
    estimateSize: () => ROW_HEIGHT, // Default row height
  }), []);

  // Update virtualizer options
  // We do this in render to ensure we have latest data for calculation
  // Since calculateRange is O(1), this is fine.
  virtualizer.setOptions({
    count: rowOrder.length,
    getScrollOffset: () => scrollTop,
    getContainerSize: () => viewportHeight,
    estimateSize: () => ROW_HEIGHT, // Fixed height for now
    overscan: OVERSCAN_COUNT
  });

  const { items, totalSize } = virtualizer.calculateRange();

  return (
    <div 
      role="rowgroup"
      className="relative w-full"
      style={{ height: totalSize, minWidth: totalWidth }}
    >
      {items.map(virtualItem => {
        const rowId = rowOrder[virtualItem.index];
        return (
          <GridRow 
            key={rowId}
            rowId={rowId}
            virtualItem={virtualItem}
            virtualColumns={virtualColumns}
            totalWidth={totalWidth}
          />
        );
      })}
    </div>
  );
}
