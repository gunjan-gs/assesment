import type { VirtualItem, VirtualRange } from './types';

export interface VirtualizerOptions {
  count: number;
  getScrollOffset: () => number;
  getContainerSize: () => number;
  estimateSize: (index: number) => number;
  overscan?: number;
}

/**
 * A pure logic virtualizer.
 * Optimized for performance with large datasets.
 * Currently optimized for fixed-height items to ensure O(1) calculations for 50k+ rows.
 */
export class Virtualizer {
  private options: VirtualizerOptions;

  constructor(options: VirtualizerOptions) {
    this.options = options;
  }

  public setOptions(newOptions: VirtualizerOptions) {
    this.options = newOptions;
  }

  /**
   * Calculates the visible range and item positions.
   * Uses O(1) calculation based on fixed item height estimate.
   */
  public calculateRange(): VirtualRange {
    const { count, getScrollOffset, getContainerSize, estimateSize, overscan = 5 } = this.options;
    const scrollOffset = getScrollOffset();
    const containerSize = getContainerSize();

    if (count === 0) {
      return { startIndex: 0, endIndex: 0, items: [], totalSize: 0 };
    }

    // We use estimateSize(0) as the fixed row height for O(1) performance on massive datasets.
    // Future enhancement: Add binary search offset cache for true variable height support.
    const itemSize = estimateSize(0); 
    const totalSize = count * itemSize;

    // Calculate start and end indices
    const startIndex = Math.max(0, Math.floor(scrollOffset / itemSize));
    const endIndex = Math.min(count - 1, Math.ceil((scrollOffset + containerSize) / itemSize));

    // Apply overscan
    const renderStartIndex = Math.max(0, startIndex - overscan);
    const renderEndIndex = Math.min(count - 1, endIndex + overscan);

    const items: VirtualItem[] = [];
    for (let i = renderStartIndex; i <= renderEndIndex; i++) {
        items.push({
            index: i,
            start: i * itemSize,
            size: itemSize,
            end: (i + 1) * itemSize
        });
    }

    return {
      startIndex: renderStartIndex,
      endIndex: renderEndIndex,
      items,
      totalSize
    };
  }
}

export interface VirtualColumn extends VirtualItem {
  id: string;
  isPinned: 'left' | 'right' | false;
  stickyOffset: number; // For pinned columns, this is the left/right value
}

export interface ColumnVirtualizerOptions {
  columnOrder: string[];
  columnWidths: Record<string, number>;
  columnVisibility?: Record<string, boolean>; // Added
  pinnedColumns: { left: string[], right: string[] };
  scrollLeft: number;
  viewportWidth: number;
  overscan?: number; // Pixels
}

export class ColumnVirtualizer {
  
  public static calculateLayout(options: ColumnVirtualizerOptions): { virtualColumns: VirtualColumn[], totalWidth: number } {
    const { columnOrder, columnWidths, columnVisibility, pinnedColumns, scrollLeft, viewportWidth, overscan = 200 } = options;

    const virtualColumns: VirtualColumn[] = [];
    let currentOffset = 0;
    
    // 1. Calculate all offsets (O(C))
    // We need to know total width
    // And we need to assign sticky offsets for pinned columns
    
    // const offsets = new Map<string, number>();
    
    // Pinned Left Logic:
    // They are physically at the start of the grid? 
    // No, "columnOrder" dictates visual order. 
    // BUT usually pinned columns are moved to the start/end of the order visually.
    // If the user's `columnOrder` has pinned columns in the middle, we should strictly respect `pinnedColumns` state for rendering?
    // Standard practice: Pinned Left columns are rendered first, then Scrollable, then Pinned Right.
    // Let's assume `columnOrder` is the SOURCE of truth for order, and pinned status just changes behavior.
    // BUT if I pin "Col Z" (which is last), it should jump to left.
    // So we should construct a "Visual Order" based on pins.
    
    const leftIds = pinnedColumns.left.filter(id => columnVisibility ? columnVisibility[id] !== false : true);
    const rightIds = pinnedColumns.right.filter(id => columnVisibility ? columnVisibility[id] !== false : true);
    const scrollableIds = columnOrder.filter(id => 
      !pinnedColumns.left.includes(id) && 
      !pinnedColumns.right.includes(id) &&
      (columnVisibility ? columnVisibility[id] !== false : true)
    );
    
    // Correct visual order: [...left, ...scrollable, ...right]
    // Note: We respect the internal order of 'left' array if multiple pins exist.
    
    const visualOrder = [...leftIds, ...scrollableIds, ...rightIds];
    
    // 2. Iterate Visual Order to Calculate Positions
    let leftStickyAccumulator = 0;
    
    // First pass: Calculate Total Width and Offsets
    // Also build right sticky accumulators?
    
    // We need to know the width of Right Pinned columns to set their "right" property correctly?
    // "right: 0" for last, "right: lastWidth" for second to last.
    const rightStickyOffsets = new Map<string, number>();
    let rightAccumulator = 0;
    for (let i = rightIds.length - 1; i >= 0; i--) {
        const id = rightIds[i];
        rightStickyOffsets.set(id, rightAccumulator);
        rightAccumulator += (columnWidths[id] || 100);
    }
    
    // Main Loop
    currentOffset = 0;
    
    const visibleStart = scrollLeft - overscan;
    const visibleEnd = scrollLeft + viewportWidth + overscan;
    
    visualOrder.forEach((id, index) => {
        const width = columnWidths[id] || 100;
        const start = currentOffset;
        const end = start + width;
        
        const isPinnedLeft = leftIds.includes(id);
        const isPinnedRight = rightIds.includes(id);
        
        let shouldRender = false;
        let stickyOffset = 0;
        
        if (isPinnedLeft) {
            shouldRender = true;
            stickyOffset = leftStickyAccumulator;
            leftStickyAccumulator += width;
        } else if (isPinnedRight) {
            shouldRender = true;
            stickyOffset = rightStickyOffsets.get(id) || 0;
        } else {
            // Scrollable
            // Check intersection
            if (end >= visibleStart && start <= visibleEnd) {
                shouldRender = true;
            }
            // No sticky offset for normal cols
        }
        
        if (shouldRender) {
            virtualColumns.push({
                index, // This is visual index
                id,
                start, // Absolute left position
                size: width,
                end,
                isPinned: isPinnedLeft ? 'left' : (isPinnedRight ? 'right' : false),
                stickyOffset
            });
        }
        
        currentOffset += width;
    });
    
    return {
        virtualColumns,
        totalWidth: currentOffset
    };
  }
}
