import { describe, it, expect } from 'vitest';
import { Virtualizer } from './virtual';

describe('Virtualizer', () => {
  const defaultOptions = {
    count: 1000,
    getScrollOffset: () => 0,
    getContainerSize: () => 500,
    estimateSize: () => 50,
    overscan: 2
  };

  it('should calculate initial range', () => {
    const virt = new Virtualizer(defaultOptions);
    const range = virt.calculateRange();

    // Visible: 500 / 50 = 10 items (0-9)
    // Overscan: 2
    // Range: 0 to 11 (10 + 2 - 1? No, end index logic)
    // StartIndex: 0
    // EndIndex: 10 (Item 10 starts at 500, which is just outside if strict, or inside if partially visible)
    // Code: ceil((0 + 500) / 50) = 10. End index is min(999, 10).
    // RenderEnd: min(999, 10 + 2) = 12.
    
    expect(range.startIndex).toBe(0);
    expect(range.endIndex).toBe(12);
    expect(range.items).toHaveLength(13); // 0 to 12 inclusive
  });

  it('should handle scrolling', () => {
    const virt = new Virtualizer({
      ...defaultOptions,
      getScrollOffset: () => 1000 // Scrolled 20 items (20 * 50 = 1000)
    });
    
    const range = virt.calculateRange();
    
    // Start index: floor(1000/50) = 20
    // End index: ceil(1500/50) = 30
    // RenderStart: 20 - 2 = 18
    // RenderEnd: 30 + 2 = 32
    
    expect(range.startIndex).toBe(18);
    expect(range.endIndex).toBe(32);
    expect(range.items[0].index).toBe(18);
    expect(range.items[0].start).toBe(18 * 50);
  });
});
