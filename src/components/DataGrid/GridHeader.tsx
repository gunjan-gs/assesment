import React from 'react';
import { useStore } from './context';
import { useGridSelector } from '../../core/hooks';
import { useColumnLayout } from './useColumnLayout';
import { GridHeaderCell } from './GridHeaderCell';
import { HEADER_HEIGHT } from '../../core/constants';

interface GridHeaderProps {
  viewportWidth: number;
}

export function GridHeader({ viewportWidth }: GridHeaderProps) {
  const store = useStore();
  const allColumns = useGridSelector(store, state => state.columns);
  
  const { virtualColumns, totalWidth } = useColumnLayout(
    viewportWidth
  );

  return (
    <div 
      role="rowgroup" 
      className="sticky top-0 z-20 flex bg-slate-50 border-b border-slate-200"
      style={{ 
        height: HEADER_HEIGHT, 
        minWidth: totalWidth 
      }}
    >
      <div role="row" aria-rowindex={1} className="contents">
      {virtualColumns.map(vCol => {
        const colDef = allColumns.find(c => c.id === vCol.id);
        if (!colDef) return null;

        const isPinned = !!vCol.isPinned;
        
        const style: React.CSSProperties = {
          width: vCol.size,
          position: isPinned ? 'sticky' : 'absolute',
          left: vCol.isPinned === 'left' ? vCol.stickyOffset : (isPinned ? undefined : vCol.start),
          right: vCol.isPinned === 'right' ? vCol.stickyOffset : undefined,
          // Header cells need specific z-index handling for pinned columns
          // GridHeaderCell handles internal z-index, but sticky positioning needs context
        };

        return (
          <GridHeaderCell
            key={vCol.id}
            column={colDef}
            virtualColumn={vCol}
            style={style}
            columnIndex={vCol.index + 1}
          />
        );
      })}
      </div>
    </div>
  );
}
