import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Virtualizer } from '../core/virtual';
import type { VirtualRange } from '../core/types';

interface UseVirtualizerProps {
  count: number;
  getContainerSize: () => number;
  estimateSize: (index: number) => number;
  overscan?: number;
  scrollElement: HTMLElement | null;
}

interface UseVirtualizerResult extends VirtualRange {
  scrollTo: (offset: number) => void;
  isScrolling: boolean;
  totalSize: number;
}

export function useVirtualizer({
  count,
  getContainerSize,
  estimateSize,
  overscan = 5,
  scrollElement
}: UseVirtualizerProps): UseVirtualizerResult {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const isScrollingTimeoutRef = useRef<number | null>(null);
  
  // We use a ref for the virtualizer instance to avoid re-instantiating it
  // unless strictly necessary, though it is a lightweight class.
  const virtualizerRef = useRef<Virtualizer | null>(null);

  if (!virtualizerRef.current) {
    virtualizerRef.current = new Virtualizer({
      count,
      getScrollOffset: () => 0, // Initial
      getContainerSize: getContainerSize,
      estimateSize,
      overscan
    });
  }

  // Update virtualizer options when props change
  useEffect(() => {
    if (virtualizerRef.current) {
      virtualizerRef.current.setOptions({
        count,
        getScrollOffset: () => scrollTop,
        getContainerSize,
        estimateSize,
        overscan
      });
    }
  }, [count, getContainerSize, estimateSize, overscan, scrollTop]);

  // Scroll Listener with RequestAnimationFrame
  useEffect(() => {
     if (!scrollElement) return;

     let ticking = false;

     const onScroll = () => {
       if (!ticking) {
         window.requestAnimationFrame(() => {
           setScrollTop(scrollElement.scrollTop);
           
           // Handle isScrolling state
           setIsScrolling(true);
           if (isScrollingTimeoutRef.current) {
               window.clearTimeout(isScrollingTimeoutRef.current);
           }
           isScrollingTimeoutRef.current = window.setTimeout(() => {
               setIsScrolling(false);
           }, 150);

           ticking = false;
         });
         ticking = true;
       }
     };

     scrollElement.addEventListener('scroll', onScroll, { passive: true });
     
     // Initial sync
     setScrollTop(scrollElement.scrollTop);

     return () => {
       scrollElement.removeEventListener('scroll', onScroll);
       if (isScrollingTimeoutRef.current) {
           window.clearTimeout(isScrollingTimeoutRef.current);
       }
     };
  }, [scrollElement]);

  // Calculate Range
  // We memorize this result to prevent recalculation if nothing changed
  const range = useMemo(() => {
    if (!virtualizerRef.current) {
        return { startIndex: 0, endIndex: 0, items: [], totalSize: 0 };
    }
    return virtualizerRef.current.calculateRange();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollTop, count, getContainerSize, estimateSize, overscan]);

  const scrollTo = useCallback((offset: number) => {
    if (scrollElement) {
      scrollElement.scrollTop = offset;
    }
  }, [scrollElement]);

  return {
    ...range,
    scrollTo,
    isScrolling,
    totalSize: range.totalSize
  };
}
