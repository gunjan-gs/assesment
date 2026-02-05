import type { GridState, RowId } from './types';

export type StoreListener<T> = (state: GridState<T>) => void;

/**
 * A dedicated store for the DataGrid.
 * Implements immutable state updates for React 18 compatibility.
 */
export class GridStore<T = unknown> {
  private state: GridState<T>;
  private listeners = new Set<StoreListener<T>>();

  constructor(initialState?: Partial<GridState<T>>) {
    // Initialize default column state if columns provided
    const columns = initialState?.columns || [];
    const columnWidths: Record<string, number> = {};
    const columnOrder: string[] = [];
    const pinnedColumns: { left: string[], right: string[] } = { left: [], right: [] };
    const columnVisibility: Record<string, boolean> = {};

    columns.forEach(col => {
      columnWidths[col.id] = col.width;
      columnOrder.push(col.id);
      columnVisibility[col.id] = true;
      if (col.pinned === 'left') pinnedColumns.left.push(col.id);
      if (col.pinned === 'right') pinnedColumns.right.push(col.id);
    });

    const mergedState = {
      rowMap: new Map(),
      rowOrder: [],
      columns: [],
      columnWidths,
      columnOrder,
      pinnedColumns,
      columnVisibility,
      selectedRows: new Set(),
      focusedCell: null,
      editingCell: null,
      sort: [],
      scrollTop: 0,
      scrollLeft: 0,
      ...initialState
    };

    // Override with calculated defaults if not present in initialState
    if (!initialState?.columnWidths) mergedState.columnWidths = columnWidths;
    if (!initialState?.pinnedColumns) mergedState.pinnedColumns = pinnedColumns;
    if (!initialState?.columnOrder) mergedState.columnOrder = columnOrder;
    if (!initialState?.columnVisibility) mergedState.columnVisibility = columnVisibility;

    this.state = mergedState as GridState<T>;
  }

  getState = (): GridState<T> => {
    return this.state;
  }

  subscribe = (listener: StoreListener<T>): () => void => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Updates the state immutably.
   * @param updater A function that receives the current state and returns a Partial<GridState> to merge,
   *                or the full new GridState.
   */
  setState = (updater: (prev: GridState<T>) => Partial<GridState<T>> | GridState<T>) => {
    const update = updater(this.state);
    
    // Shallow merge if partial, or replacement
    const nextState = { ...this.state, ...update };
    
    // Equality check (simple reference check isn't enough if we always spread, 
    // but for now we assume the updater intends a change).
    // In a real prod app we might do shallow comparison here to avoid notifying if nothing changed.
    
    this.state = nextState;
    this.notify();
  }

  private notify = () => {
    this.listeners.forEach(listener => listener(this.state));
  }

  // --- Actions ---

  private sortRows = (state: GridState<T>): RowId[] => {
    const { sort, rowMap, rowOrder } = state;
    if (sort.length === 0) return [...rowOrder]; // Return current order if no sort (or should we reset to original?)
    // For now, let's assume rowOrder is the source of truth, but if we want to reset, we might need 'originalRowOrder'.
    // However, usually we just sort the existing set.
    
    // Create a copy to sort
    const sorted = [...rowOrder].sort((aId, bId) => {
      const rowA = rowMap.get(aId);
      const rowB = rowMap.get(bId);
      if (!rowA || !rowB) return 0;

      for (const s of sort) {
        const valA = (rowA as Record<string, unknown>)[s.columnId];
        const valB = (rowB as Record<string, unknown>)[s.columnId];
        
        if (valA === valB) continue;
        
        const direction = s.direction === 'asc' ? 1 : -1;
        
        if (valA == null) return 1 * direction; // nulls last
        if (valB == null) return -1 * direction;
        
        if (valA < valB) return -1 * direction;
        if (valA > valB) return 1 * direction;
      }
      return 0;
    });

    return sorted;
  }

  toggleSort = (columnId: string, multi: boolean) => {
    this.setState(prev => {
      const existingSort = prev.sort.find(s => s.columnId === columnId);
      let newSort = [...prev.sort];

      if (!multi) {
        // Single sort mode: clear others
        if (existingSort) {
          if (existingSort.direction === 'asc') {
             newSort = [{ columnId, direction: 'desc' }];
          } else {
             newSort = [];
          }
        } else {
           newSort = [{ columnId, direction: 'asc' }];
        }
      } else {
        // Multi sort mode
        if (existingSort) {
          if (existingSort.direction === 'asc') {
             // Flip to desc
             newSort = newSort.map(s => s.columnId === columnId ? { ...s, direction: 'desc' } : s);
          } else {
             // Remove
             newSort = newSort.filter(s => s.columnId !== columnId);
          }
        } else {
          // Append
          newSort.push({ columnId, direction: 'asc' });
        }
      }
      
      // Apply Sort
      const sortedRowOrder = this.sortRows({ ...prev, sort: newSort });

      return { sort: newSort, rowOrder: sortedRowOrder };
    });
  }

  resizeColumn = (columnId: string, width: number) => {
    this.setState(prev => ({
      ...prev,
      columnWidths: {
        ...prev.columnWidths,
        [columnId]: Math.max(50, width) // Enforce min width of 50px
      }
    }));
  }

  toggleColumnVisibility = (columnId: string) => {
    this.setState(prev => ({
      columnVisibility: {
        ...prev.columnVisibility,
        [columnId]: !prev.columnVisibility[columnId]
      }
    }));
  }

  moveColumn = (dragColumnId: string, hoverColumnId: string) => {
    this.setState(prev => {
      const newOrder = [...prev.columnOrder];
      const dragIndex = newOrder.indexOf(dragColumnId);
      const hoverIndex = newOrder.indexOf(hoverColumnId);
      
      if (dragIndex === -1 || hoverIndex === -1 || dragIndex === hoverIndex) return prev;
      
      newOrder.splice(dragIndex, 1);
      newOrder.splice(hoverIndex, 0, dragColumnId);
      
      return { columnOrder: newOrder };
    });
  }

  // --- Editing Actions ---

  startEdit = (rowId: string | number, colId: string, value: unknown) => {
    this.setState(() => ({
      editingCell: {
        rowId,
        colId,
        value,
        originalValue: value,
        isSaving: false,
        error: null
      }
    }));
  }

  updateEditValue = (value: unknown) => {
    this.setState(prev => prev.editingCell ? {
      editingCell: { ...prev.editingCell, value, error: null }
    } : {});
  }

  cancelEdit = () => {
    this.setState(() => ({ editingCell: null }));
  }

  setEditSaving = (isSaving: boolean) => {
    this.setState(prev => prev.editingCell ? {
      editingCell: { ...prev.editingCell, isSaving }
    } : {});
  }

  setEditError = (error: string | null) => {
    this.setState(prev => prev.editingCell ? {
      editingCell: { ...prev.editingCell, error, isSaving: false }
    } : {});
  }

  // --- Data Actions ---

  setData = (rows: T[], getRowId: (row: T) => RowId) => {
    const rowMap = new Map<RowId, T>();
    const rowOrder: RowId[] = [];

    rows.forEach(row => {
      const id = getRowId(row);
      rowMap.set(id, row);
      rowOrder.push(id);
    });

    this.setState(prev => {
      // If there is an active sort, apply it to the new data
      const nextState = {
        ...prev,
        rowMap,
        rowOrder
      };
      
      if (prev.sort.length > 0) {
        nextState.rowOrder = this.sortRows(nextState);
      }
      
      return nextState;
    });
  }

  updateRow = (rowId: RowId, updates: Partial<T>) => {
    this.setState(prev => {
      const row = prev.rowMap.get(rowId);
      if (!row) return prev;

      const newRow = { ...row, ...updates };
      const newRowMap = new Map(prev.rowMap);
      newRowMap.set(rowId, newRow);

      return {
        ...prev,
        rowMap: newRowMap
      };
    });
  }

  commitEdit = () => {
    this.setState(prev => {
      if (!prev.editingCell) return prev;

      const { rowId, colId, value } = prev.editingCell;
      const row = prev.rowMap.get(rowId);
      
      if (!row) return { ...prev, editingCell: null };

      // Update the row
      const newRow = { ...row, [colId]: value };
      const newRowMap = new Map(prev.rowMap);
      newRowMap.set(rowId, newRow as T);

      return {
        ...prev,
        rowMap: newRowMap,
        editingCell: null
      };
    });
  }
}
