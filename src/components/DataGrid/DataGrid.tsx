import React, { useState, useMemo, useEffect } from 'react';
import { useVirtualizer } from '../../hooks/useVirtualizer';
import { ColumnVirtualizer } from '../../core/virtual';
import type { ColumnDef, RowId, SortDescriptor } from '../../core/types';
import { cn } from '../../lib/utils';

interface DataGridProps<T = unknown> {
  data: T[];
  columns: ColumnDef<T>[];
  rowHeight?: number;
  className?: string;
}

export const DataGrid = <T extends { id: RowId }>({ 
  data, 
  columns, 
  rowHeight = 40,
  className 
}: DataGridProps<T>) => {
  console.debug('DataGrid rendering with', data.length, 'rows'); // Keep debug log for now
  
  // Use state instead of ref for scroll element to ensure virtualizer updates when element is mounted
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [scrollLeft, setScrollLeft] = useState(0);

  // --- State ---
  const [sort, setSort] = useState<SortDescriptor[]>([]);
  // Renaming 'focusedCell' to 'cursorPosition' to match OS-level navigation concepts
  const [cursorPosition, setCursorPosition] = useState<{ rowId: RowId, colId: string } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<RowId>>(new Set());

  // --- Sorting Logic ---
  const sortedData = useMemo(() => {
    if (sort.length === 0) return data;

    return [...data].sort((a, b) => {
      for (const { columnId, direction } of sort) {
        // Handle sorting (assumes primitives or add accessible accessor)
        const aVal = (a as Record<string, unknown>)[columnId];
        const bVal = (b as Record<string, unknown>)[columnId];
        
        if (aVal === bVal) continue;
        
        // Handle comparisons safely
        if (typeof aVal === 'number' && typeof bVal === 'number') {
             return direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        if (typeof aVal === 'string' && typeof bVal === 'string') {
            const compare = aVal.localeCompare(bVal);
            return direction === 'asc' ? compare : -compare;
        }
        
        // Fallback
        const compare = String(aVal) > String(bVal) ? 1 : -1;
        return direction === 'asc' ? compare : -compare;
      }
      return 0;
    });
  }, [data, sort]);

  // --- Virtualization ---
  
  // 1. Container Resize Observer
  // We perform an immediate measurement within useEffect to prevent the "5 rows" flash
  // before the ResizeObserver kicks in, ensuring initial render accuracy.
  useEffect(() => {
    if (!scrollElement) return;
    
    // Immediate measurement for initial render
    const measure = () => {
        setContainerSize({
            width: scrollElement.clientWidth,
            height: scrollElement.clientHeight
        });
    };
    measure();

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(scrollElement);
    return () => observer.disconnect();
  }, [scrollElement]);

  // 2. Row Virtualizer (Vertical)
  // Options tuned for massive datasets (50k+ rows) to prevent layout thrashing
  const rowVirtualizer = useVirtualizer({
    count: sortedData.length,
    getContainerSize: () => containerSize.height,
    estimateSize: () => rowHeight,
    overscan: 5, // Keep low to minimize DOM nodes, increase if scrolling shows white space
    scrollElement: scrollElement
  });

  // 3. Column Layout (Horizontal Virtualization & Sticky)
  const { virtualColumns, totalWidth } = useMemo(() => {
      const columnWidths: Record<string, number> = {};
      const columnOrder: string[] = [];
      const pinnedColumns = { left: [] as string[], right: [] as string[] };
      const visibility: Record<string, boolean> = {};

      columns.forEach(col => {
          columnWidths[col.id] = col.width || 150;
          columnOrder.push(col.id);
          if (col.pinned === 'left') pinnedColumns.left.push(col.id);
          if (col.pinned === 'right') pinnedColumns.right.push(col.id);
          visibility[col.id] = true;
      });

      return ColumnVirtualizer.calculateLayout({
          columnOrder,
          columnWidths,
          columnVisibility: visibility,
          pinnedColumns,
          scrollLeft,
          viewportWidth: containerSize.width,
          overscan: 500
      });
   }, [columns, containerSize.width, scrollLeft]);

  // Sync scrollLeft for Virtual Columns
  // Dropped useCallback here as this is passed to a native DOM element (minor overhead VS readability)
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollLeft = e.currentTarget.scrollLeft;
      if (Math.abs(newScrollLeft - scrollLeft) > 0.5) { // Threshold to prevent jitter loops on high-DPI screens
          setScrollLeft(newScrollLeft);
      }
  };

  // --- Keyboard Navigation ---
  // Implements the "Roaming Tabindex" pattern for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!cursorPosition && sortedData.length > 0 && columns.length > 0) {
        // Initial focus entry point
        if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            setCursorPosition({ rowId: sortedData[0].id, colId: columns[0].id });
        }
        return;
    }
    
    if (!cursorPosition) return;

    const rowIndex = sortedData.findIndex(row => row.id === cursorPosition.rowId);
    const colIndex = columns.findIndex(col => col.id === cursorPosition.colId);
    
    if (rowIndex === -1 || colIndex === -1) return;

    let nextRowIndex = rowIndex;
    let nextColIndex = colIndex;
    let handled = false;

    switch (e.key) {
        case 'ArrowUp':
            nextRowIndex = Math.max(0, rowIndex - 1);
            handled = true;
            break;
        case 'ArrowDown':
            nextRowIndex = Math.min(sortedData.length - 1, rowIndex + 1);
            handled = true;
            break;
        case 'ArrowLeft':
            nextColIndex = Math.max(0, colIndex - 1);
            handled = true;
            break;
        case 'ArrowRight':
            nextColIndex = Math.min(columns.length - 1, colIndex + 1);
            handled = true;
            break;
        case ' ': { // Space to select
            e.preventDefault();
            const rowId = sortedData[rowIndex].id;
            const newSet = new Set(selectedRows);
            if (newSet.has(rowId)) newSet.delete(rowId);
            else newSet.add(rowId);
            setSelectedRows(newSet);
            return;
        }
    }

    if (handled) {
        e.preventDefault();
        
        // Update Cursor
        const nextRow = sortedData[nextRowIndex];
        const nextCol = columns[nextColIndex];
        setCursorPosition({ rowId: nextRow.id, colId: nextCol.id });
        
        // Auto-scroll Vertical
        const rowStart = nextRowIndex * rowHeight;
        const rowEnd = rowStart + rowHeight;
        const scrollTop = scrollElement?.scrollTop || 0;
        const viewportHeight = containerSize.height;
        
        const headerHeight = rowHeight; // Approximation
        
        if (rowStart < scrollTop + headerHeight) {
            rowVirtualizer.scrollTo(rowStart - headerHeight);
        } else if (rowEnd > scrollTop + viewportHeight) {
             rowVirtualizer.scrollTo(rowEnd - viewportHeight);
        }

        // Auto-scroll Horizontal (Simplified for readabitity, can be moved to utility)
        const nextColStart = columns.slice(0, nextColIndex).reduce((acc, c) => acc + c.width, 0); 
        const nextColEnd = nextColStart + nextCol.width;
        const viewportWidth = containerSize.width;
        
        if (nextColStart < scrollLeft) {
            if (scrollElement) scrollElement.scrollLeft = nextColStart;
        } else if (nextColEnd > scrollLeft + viewportWidth) {
             if (scrollElement) scrollElement.scrollLeft = nextColEnd - viewportWidth;
        }
    }
  };
  
  // --- Header Sorting Handler ---
  // Renamed to 'dispatchSortAction' to indicate side-effects
  const dispatchSortAction = (colId: string, multi: boolean) => {
      setSort(prev => {
          const existingIdx = prev.findIndex(s => s.columnId === colId);
          const existing = prev[existingIdx];
          
          let nextSort: SortDescriptor[] = multi ? [...prev] : [];
          
          if (existing) {
              if (existing.direction === 'asc') {
                  // Toggle to desc
                   if (multi) nextSort[existingIdx] = { ...existing, direction: 'desc' };
                   else nextSort = [{ columnId: colId, direction: 'desc' }];
              } else {
                  // Remove
                  if (multi) nextSort.splice(existingIdx, 1);
                  else nextSort = []; // unsorted
              }
          } else {
              // Add asc
              const newSort: SortDescriptor = { columnId: colId, direction: 'asc' };
              if (multi) nextSort.push(newSort);
              else nextSort = [newSort];
          }
          return nextSort;
      });
  };


  // --- Accessibility Helper ---
  const getCellId = (rowId: RowId, colId: string) => `cell-${rowId}-${colId}`;

  // --- Animation State ---
  // To prevent "flickering" (animations re-playing when isScrolling toggles),
  // we restrict the entry animation to the very first load only.
  const [isInitialRender, setIsInitialRender] = useState(true);

  useEffect(() => {
      // Disable the animation flag after the longest possible delay + duration (~1.2s)
      const timer = setTimeout(() => {
          setIsInitialRender(false);
      }, 1200);
      return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      // Pillar 1: Premium Typography & Interaction
      // - antialiased: Crisp text on high-res logic
      // - tracking-tight: More professional/dense feel
      // - tabular-nums: Prevents layout jitter on number updates
      className={cn(
          "relative w-full h-full overflow-hidden flex flex-col",
          "bg-grid-surface border border-grid-border rounded-xl shadow-premium",
          "focus:ring-2 focus:ring-indigo-500/20 focus:outline-none ring-offset-0", // Subtle focus ring
          "font-sans antialiased tracking-tight tabular-nums", 
          className
      )}
      role="grid"
      aria-rowcount={sortedData.length}
      aria-colcount={columns.length}
      onKeyDown={handleKeyDown}
      onFocus={() => {
        // Pillar 1: Auto-focus first cell on tab-in
        if (!cursorPosition && sortedData.length > 0 && columns.length > 0) {
            // Prevent finding "relatedTarget" if we are just clicking a cell (click handles its own focus)
            // But here we rely on React state, so simple check is fine.
            setCursorPosition({ rowId: sortedData[0].id, colId: columns[0].id });
        }
      }}
      tabIndex={0} 
      aria-activedescendant={cursorPosition ? getCellId(cursorPosition.rowId, cursorPosition.colId) : undefined}
    >
        {/* Scroll Container */}
        <div 
            ref={setScrollElement}
            className="flex-1 overflow-auto relative outline-none"
            onScroll={onScroll}
        >
            <div 
                // Pillar 6: Performance Heuristics
                // will-change-transform hints the browser compositor to promote this layer,
                // preventing main-thread layout recalculations during rapid scroll.
                className="will-change-transform"
                style={{ 
                    height: rowVirtualizer.totalSize, 
                    width: totalWidth,
                    position: 'relative'
                }}
            >
                {/* Sticky Header Row */}
                <div 
                    className="sticky top-0 z-30 flex bg-grid-header/80 backdrop-blur-md border-b border-grid-border font-medium text-xs text-zinc-500 uppercase tracking-wider"
                    style={{ height: rowHeight, width: totalWidth }}
                    role="row"
                    aria-rowindex={1}
                >
                    {virtualColumns.map(col => {
                        const colDef = columns.find(c => c.id === col.id);
                        const isPinned = !!col.isPinned;
                        const sortState = sort.find(s => s.columnId === col.id);
                        
                        const leftPos = (isPinned && col.isPinned === 'left') 
                            ? (scrollLeft + col.stickyOffset)
                            : col.start;

                        return (
                            <div
                                key={col.id}
                                className={cn(
                                    "absolute top-0 h-full flex items-center px-4 border-r border-grid-border select-none cursor-pointer hover:bg-zinc-200/50 transition-colors",
                                    isPinned && "bg-grid-header z-30 shadow-[1px_0_0_0_var(--grid-border)]"
                                )}
                                style={{
                                    transform: `translateX(${leftPos}px)`,
                                    width: col.size,
                                }}
                onClick={(e) => dispatchSortAction(col.id, e.shiftKey || e.metaKey)}
                                role="columnheader"
                                aria-colindex={col.index + 1}
                                aria-sort={sortState ? (sortState.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                            >
                                <span className="truncate">{colDef?.title}</span>
                                {sortState && (
                                    <span className="ml-1.5 text-zinc-800">
                                        {sortState.direction === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                                {!sortState && colDef?.sortable && (
                                    <span className="ml-1.5 opacity-0 group-hover:opacity-40 transition-opacity">
                                        ↕
                                    </span>
                                )}
                                <span className="absolute right-0 top-0 h-full w-1 cursor-col-resize opacity-0 group-hover:opacity-100 bg-blue-400/50 hover:bg-blue-500 transition-all z-50"/>
                            </div>
                        );
                    })}
                </div>

                {/* Virtual Rows */}
                {rowVirtualizer.items.map(virtualRow => {
                    const row = sortedData[virtualRow.index];
                    const isSelected = selectedRows.has(row.id);

                    return (
                        <div
                            key={row.id}
                            className={cn(
                                "absolute left-0 w-full border-b border-grid-border transition-colors duration-100 ease-out flex",
                                // Only animate the initial load items or when carefully controlled to avoid scroll noise
                                isInitialRender && "animate-premium-entry",
                                isSelected ? "bg-grid-row-selected" : "hover:bg-grid-row-hover",
                                !isSelected && "bg-grid-surface"
                            )}
                            style={{
                                height: virtualRow.size,
                                transform: `translateY(${virtualRow.start}px)`,
                                // Cascade effect for the first screen of items
                                animationDelay: isInitialRender ? `${Math.min(virtualRow.index, 20) * 0.04}s` : '0s'
                            }}
                            role="row"
                            aria-rowindex={virtualRow.index + 2} 
                            aria-selected={isSelected}
                            onClick={() => {
                                const newSet = new Set(selectedRows);
                                if (newSet.has(row.id)) newSet.delete(row.id);
                                else newSet.add(row.id);
                                setSelectedRows(newSet);
                                setCursorPosition({ rowId: row.id, colId: columns[0].id }); 
                            }}
                        >
                            {virtualColumns.map(col => {
                                const colDef = columns.find(c => c.id === col.id);
                                const cellValue = (row as Record<string, unknown>)[col.id];
                                const isPinned = !!col.isPinned;
                                const leftPos = (isPinned && col.isPinned === 'left') 
                                    ? (scrollLeft + col.stickyOffset)
                                    : col.start;

                                const isFocused = cursorPosition?.rowId === row.id && cursorPosition?.colId === col.id;

                                return (
                                    <div
                                        key={col.id}
                                        id={getCellId(row.id, col.id)}
                                        className={cn(
                                            "absolute top-0 h-full px-4 flex items-center whitespace-nowrap overflow-hidden text-sm text-zinc-900 border-r border-transparent",
                                             isPinned && "bg-inherit z-10 shadow-[1px_0_0_0_var(--grid-border)] border-r-grid-border",
                                             // Pillar 1: Focus Rings
                                             // Double ring technique for contrast:
                                             // ring-offset-2 creates white space, ring-indigo-500 creates the brand selection
                                             isFocused && "z-20 ring-2 ring-indigo-500/90 ring-offset-2 ring-offset-white"
                                        )}
                                        style={{
                                            transform: `translateX(${leftPos}px)`,
                                            width: col.size,
                                        }}
                                        role="gridcell"
                                        aria-colindex={col.index + 1}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCursorPosition({ rowId: row.id, colId: col.id });
                                        }}
                                    >
                                        {colDef?.render ? colDef.render(cellValue, row) : (cellValue as import('react').ReactNode)}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
        
        {/* Footer */}
        <div className="h-9 min-h-[36px] border-t border-grid-border bg-grid-header flex items-center px-4 text-xs font-mono text-zinc-500 justify-between select-none">
            <div className="flex items-center gap-4">
               <span>{sortedData.length.toLocaleString()} rows</span>
               {sort.length > 0 && <span className="text-zinc-400">Sorted by {sort.map(s => s.columnId).join(', ')}</span>}
            </div>
            
            <div className="flex items-center gap-2">
                 <span>{selectedRows.size > 0 ? `${selectedRows.size} selected` : ''}</span>
            </div>
        </div>

        {/* Pillar 5: Live Announcer for Screen Readers */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {sort.length > 0 
                ? `Sorted by ${sort.map(s => `${s.columnId} ${s.direction}ending`).join(', ')}. ${sortedData.length} rows found.`
                : ''}
        </div>
    </div>
  );
};
