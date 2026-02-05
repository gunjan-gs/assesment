export type RowId = string | number;
export type ColumnId = string;

export interface ColumnDef<T = unknown> {
  id: ColumnId;
  title: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  pinned?: 'left' | 'right' | false;
  resizable?: boolean;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface CellPosition {
  rowId: RowId;
  colId: ColumnId;
}

export interface SortDescriptor {
  columnId: ColumnId;
  direction: 'asc' | 'desc';
}

export interface EditingState {
  rowId: RowId;
  colId: ColumnId;
  value: unknown;
  originalValue: unknown;
  isSaving: boolean;
  error?: string | null;
}

export interface GridState<T = unknown> {
  // Data
  rowMap: Map<RowId, T>;
  rowOrder: RowId[];
  
  // Column State (Normalized)
  columns: ColumnDef<T>[]; // Original definitions
  columnWidths: Record<ColumnId, number>;
  columnOrder: ColumnId[];
  pinnedColumns: { left: ColumnId[], right: ColumnId[] };
  columnVisibility: Record<ColumnId, boolean>;
  
  // State
  selectedRows: Set<RowId>;
  focusedCell: CellPosition | null;
  editingCell: EditingState | null;
  sort: SortDescriptor[]; // Multi-column sort
  
  // Scroll
  scrollTop: number;
  scrollLeft: number;
}

export interface VirtualItem {
  index: number;
  start: number; // pixel offset from top/left
  size: number; // height or width
  end: number; // start + size
}

export interface VirtualRange {
  startIndex: number;
  endIndex: number;
  items: VirtualItem[];
  totalSize: number;
}
