import { useRef, useState, useLayoutEffect } from 'react';
import type { VirtualItem, VirtualRange } from './types';

interface UseVirtualizerOptions {
  count: number;
  getScrollElement: () => HTMLElement | null;
  estimateSize: (index: number) => number;
  overscan?: number;
}

/**
 * Custom hook for virtualizing a list of items.
 * Handles the math for calculating which items to render based on scroll position.
 * 
 * Architecture:
 * - Uses a fixed height calculation for performance (O(1)).
 * - Manages scroll offsets and range calculations.
 * - Supports overscanning to prevent white flashes.
 */
export function useVirtualizer({
  count,
  getScrollElement,
  estimateSize,
  overscan = 5
}: UseVirtualizerOptions) {
  // Store the latest measurement state
  const [range, setRange] = useState<VirtualRange>({
    startIndex: 0,
    endIndex: 0,
    items: [],
    totalSize: 0
  });

  const rangeRef = useRef(range);
  useLayoutEffect(() => {
    rangeRef.current = range;
  });

  // Measurement cache (for variable height support in future)
  // For now we assume fixed height from estimateSize(0) for O(1) perf
  const itemSize = estimateSize(0);
  const totalSize = count * itemSize;

  // Main measurement logic
  const measure = () => {
    const element = getScrollElement();
    if (!element) return;

    const scrollTop = element.scrollTop;
    const containerHeight = element.clientHeight;

    // 1. Calculate Start Index
    // Math.floor(scrollTop / itemSize) gives us the first visible item
    // We clamp it between 0 and count-1
    let startIndex = Math.floor(scrollTop / itemSize);
    startIndex = Math.max(0, Math.min(count - 1, startIndex));

    // 2. Calculate End Index
    // (scrollTop + containerHeight) / itemSize gives us the last visible item
    let endIndex = Math.ceil((scrollTop + containerHeight) / itemSize);
    endIndex = Math.max(0, Math.min(count - 1, endIndex));

    // 3. Add Overscan (Buffer)
    // Render extra rows above and below to ensure smooth scrolling
    startIndex = Math.max(0, startIndex - overscan);
    endIndex = Math.min(count - 1, endIndex + overscan);

    // 4. Generate Virtual Items
    const items: VirtualItem[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        start: i * itemSize,
        size: itemSize,
        end: (i + 1) * itemSize
      });
    }

    // 5. Update State if Changed
    const prev = rangeRef.current;
    if (
      prev.startIndex !== startIndex ||
      prev.endIndex !== endIndex ||
      prev.totalSize !== totalSize
    ) {
      setRange({
        startIndex,
        endIndex,
        items,
        totalSize
      });
    }
  };

  // Subscribe to scroll events
  useLayoutEffect(() => {
    const element = getScrollElement();
    if (!element) return;

    // Initial measure
    measure();
    
    // Add scroll listener
    element.addEventListener('scroll', measure, { passive: true });
    
    // Add resize listener
    // Use ResizeObserver for more performant container resize detection
    const resizeObserver = new ResizeObserver(() => {
      measure();
    });
    resizeObserver.observe(element);

    return () => {
      element.removeEventListener('scroll', measure);
      resizeObserver.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getScrollElement, count, estimateSize, overscan, itemSize, totalSize]);

  return range;
}
