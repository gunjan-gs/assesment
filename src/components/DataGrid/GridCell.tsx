import React, { memo, useEffect, useRef } from 'react';
import { useStore, useGridConfig } from './context';
import { useGridSelector } from '../../core/hooks';
import type { ColumnDef } from '../../core/types';
import { cn } from '../../lib/utils';

interface GridCellProps<T = unknown> {
  column: ColumnDef<T>;
  row: T;
  rowId: string | number;
  style: React.CSSProperties;
  isPinned?: boolean;
  columnIndex: number;
}

const CellEditor = memo(function CellEditor({ autoFocus }: { autoFocus?: boolean }) {
  const store = useStore();
  const config = useGridConfig();
  const editingCell = useGridSelector(store, state => state.editingCell);
  
  const value = editingCell?.value;
  const error = editingCell?.error;
  const isSaving = editingCell?.isSaving;
  
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    store.updateEditValue(e.target.value);
  };

  const commit = async () => {
    if (!editingCell) return;
    
    if (config.onCellEdit) {
      // Capture state for potential rollback
      const { rowId, colId, value } = editingCell;
      const state = store.getState();
      const row = state.rowMap.get(rowId);
      const oldValue = row ? (row as Record<string, unknown>)[colId] : undefined;

      // Optimistic update: Commit immediately to store and close editor
      store.commitEdit();
      
      try {
        await config.onCellEdit({ 
          rowId, 
          colId, 
          value 
        });
        // Success: Data is already updated in store
      } catch (e: any) {
        // Failure: Rollback and re-open editor with error
        store.updateRow(rowId, { [colId]: oldValue } as any);
        store.startEdit(rowId, colId, value); // Restore user's input
        store.setEditError(e.message || 'Validation failed');
      }
    } else {
      store.commitEdit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation(); 
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      store.cancelEdit();
    }
  };

  const handleBlur = () => {
     if (!isSaving && !error) {
       commit();
     }
  };

  return (
    <div className="w-full h-full relative">
      <input
        ref={ref}
        type="text"
        className={cn(
          "w-full h-full px-2 py-1 outline-none bg-white border-2 border-blue-500 rounded-sm",
          error && "border-red-500 bg-red-50",
          isSaving && "bg-slate-100 text-slate-400 cursor-wait"
        )}
        value={(value as string) ?? ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={isSaving}
      />
      {error && (
        <div className="absolute top-full left-0 z-50 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg mt-1 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
});

export const GridCell = memo(function GridCell<T>({ column, row, rowId, style, isPinned, columnIndex }: GridCellProps<T>) {
  const store = useStore();
  
  const isFocused = useGridSelector(store, state => {
    return state.focusedCell?.rowId === rowId && state.focusedCell?.colId === column.id;
  });

  const isSelected = useGridSelector(store, state => state.selectedRows.has(rowId));
  
  const isEditing = useGridSelector(store, state => 
    state.editingCell?.rowId === rowId && state.editingCell?.colId === column.id
  );

  const handleDoubleClick = () => {
    store.startEdit(rowId, column.id, (row as any)[column.id]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isEditing) {
      e.preventDefault();
      store.startEdit(rowId, column.id, (row as any)[column.id]);
    }
  };
  
  return (
    <div
      role="gridcell"
      aria-selected={isSelected}
      aria-colindex={columnIndex} 
      tabIndex={isFocused ? 0 : -1}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      className={cn(
          "flex items-center p-3 text-sm text-zinc-700 truncate border-r border-zinc-50 last:border-r-0 bg-white outline-none transition-colors duration-75 tabular-nums font-sans tracking-tight antialiased",
          isPinned && "sticky z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]", // More subtle shadow
          isSelected && !isFocused && "bg-blue-50/30",
          // Pillar 1: The "Figma" Focus Ring
          // - ring-offset-2: Separates ring from content (Pro)
          // - ring-indigo-500/90: Modern SaaS color
          isFocused && !isEditing && "z-20 ring-2 ring-indigo-500/90 ring-offset-2 ring-offset-white"
      )}
      style={style}
    >
      {isEditing ? (
        <CellEditor autoFocus />
      ) : (
        column.render ? column.render((row as any)[column.id], row) : ((row as any)[column.id] as React.ReactNode)
      )}
    </div>
  );
});
