import React, { memo } from 'react';
import { useStore } from './context';
import { useGridSelector } from '../../core/hooks';
import type { VirtualItem } from '../../core/types';
import type { VirtualColumn } from '../../core/virtual';
import { GridCell } from './GridCell';
import { cn } from '../../lib/utils';

interface GridRowProps {
  rowId: string | number;
  virtualItem: VirtualItem;
  virtualColumns: VirtualColumn[];
  totalWidth: number;
}

export const GridRow = memo(function GridRow({ rowId, virtualItem, virtualColumns, totalWidth }: GridRowProps) {
  const store = useStore();
  
  // Select only the data for this row
  const rowData = useGridSelector(store, state => state.rowMap.get(rowId));
  const isSelected = useGridSelector(store, state => state.selectedRows.has(rowId));
  const allColumns = useGridSelector(store, state => state.columns);

  if (!rowData) return null;

  return (
    <div
      role="row"
      aria-rowindex={virtualItem.index + 2} // +2: 1-based index, plus header row
      aria-selected={isSelected}
      className={cn(
          // Pillar 1: Micro-interactions
          // - duration-100 ease-out: Feels snappier than linear/duration-75
          // - tracking-tight: Consistent premium typography
          "absolute top-0 left-0 flex border-b border-zinc-100 tracking-tight transition-colors duration-100 ease-out",
          isSelected ? "bg-blue-50/60" : "hover:bg-zinc-50/80", // Lighter, more subtle hover
          isSelected && "hover:bg-blue-50/80" // Darken slightly on hover if selected
      )}
      style={{
        height: virtualItem.size,
        width: totalWidth,
        transform: `translateY(${virtualItem.start}px)`,
      }}
    >
      {virtualColumns.map(vCol => {
        const colDef = allColumns.find(c => c.id === vCol.id);
        if (!colDef) return null;

        const isPinned = !!vCol.isPinned;
        
        const style: React.CSSProperties = {
          width: vCol.size,
          position: isPinned ? 'sticky' : 'absolute',
          left: vCol.isPinned === 'left' ? vCol.stickyOffset : (isPinned ? undefined : vCol.start),
          right: vCol.isPinned === 'right' ? vCol.stickyOffset : undefined,
          zIndex: isPinned ? 2 : 1,
          backgroundColor: isPinned ? 'inherit' : undefined, // Inherit row bg
        };

        return (
          <GridCell 
            key={vCol.id}
            column={colDef}
            row={rowData}
            rowId={rowId}
            style={style}
            isPinned={isPinned}
            columnIndex={vCol.index + 1}
          />
        );
      })}
    </div>
  );
});
