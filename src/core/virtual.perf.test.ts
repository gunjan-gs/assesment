import { describe, it, expect } from 'vitest';
import { Virtualizer } from './virtual';

describe('Virtualizer Performance', () => {
  const createVirtualizer = (count: number, scrollOffset: number, containerSize: number) => {
    return new Virtualizer({
      count,
      getScrollOffset: () => scrollOffset,
      getContainerSize: () => containerSize,
      estimateSize: () => 35, // 35px fixed height
      overscan: 5
    });
  };

  it('calculates range for 50k rows instantly', () => {
    const start = performance.now();
    const virtualizer = createVirtualizer(50000, 25000 * 35, 800); // Scrolled to middle
    const range = virtualizer.calculateRange();
    const end = performance.now();
    
    expect(range.startIndex).toBeGreaterThan(0);
    expect(range.endIndex).toBeLessThan(50000);
    expect(range.items.length).toBeGreaterThan(0);
    
    // Should be sub-millisecond for O(1)
    expect(end - start).toBeLessThan(5); 
    
    console.log(`Calculation time for 50k rows: ${end - start}ms`);
  });

  it('handles 1 million rows correctly', () => {
    const totalCount = 1000000;
    const itemSize = 35;
    const containerSize = 800;
    const maxScroll = (totalCount * itemSize) - containerSize;
    
    const virtualizer = createVirtualizer(totalCount, maxScroll, containerSize); // Scrolled to very bottom
    const range = virtualizer.calculateRange();
    
    expect(range.endIndex).toBe(totalCount - 1);
    expect(range.items.length).toBeLessThan(100); // Should only render viewport + overscan
  });
  
  it('correctly calculates total size', () => {
     const virtualizer = createVirtualizer(50000, 0, 800);
     const range = virtualizer.calculateRange();
     expect(range.totalSize).toBe(50000 * 35);
  });
});
