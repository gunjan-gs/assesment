import React, { memo } from 'react';
import { useStore } from './context';
import { useGridSelector } from '../../core/hooks';
import type { ColumnDef } from '../../core/types';
import type { VirtualColumn } from '../../core/virtual';
import { ResizeHandle } from './ResizeHandle';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GridHeaderCellProps<T> {
  column: ColumnDef<T>;
  virtualColumn: VirtualColumn;
  style: React.CSSProperties;
  columnIndex: number;
}

export const GridHeaderCell = memo(function GridHeaderCell<T>({ column, virtualColumn, style, columnIndex }: GridHeaderCellProps<T>) {
  const store = useStore();
  const sort = useGridSelector(store, state => state.sort);

  const sortItem = sort.find(s => s.columnId === column.id);
  const sortIndex = sort.length > 1 ? sort.findIndex(s => s.columnId === column.id) + 1 : null;
  const isPinned = !!virtualColumn.isPinned;

  const handleSort = (e: React.MouseEvent) => {
    if (column.sortable === false) return;
    store.toggleSort(column.id, e.shiftKey);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', column.id);
    e.dataTransfer.effectAllowed = 'move';
    // Make the ghost image semi-transparent
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== column.id) {
      store.moveColumn(sourceId, column.id);
    }
  };

  return (
    <div
      role="columnheader"
      aria-colindex={columnIndex}
      aria-sort={sortItem ? (sortItem.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      draggable={!isPinned} // Only unpinned columns are draggable for now
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleSort}
      className={twMerge(
        clsx(
          "absolute top-0 flex items-center p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 border-r border-slate-200 last:border-r-0 truncate transition-colors duration-100 select-none h-full group",
          column.sortable !== false && "cursor-pointer hover:bg-slate-100 hover:text-slate-700",
          !isPinned && "active:cursor-grabbing",
          isPinned && "z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
          // Ensure pinned header cells stay on top of scrollable ones, but below other overlays if any
          isPinned ? "z-30" : "z-20"
        )
      )}
      style={style}
    >
      <span className="truncate flex-1">{column.title}</span>
      
      {sortItem && (
        <div className="ml-2 flex items-center gap-0.5 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] font-bold">
          {sortIndex && <span>{sortIndex}</span>}
          <span>{sortItem.direction === 'asc' ? '↑' : '↓'}</span>
        </div>
      )}

      {column.resizable !== false && (
        <ResizeHandle columnId={column.id} width={virtualColumn.size} />
      )}
    </div>
  );
});
