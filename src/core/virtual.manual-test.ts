import { Virtualizer } from './virtual';

// Mock suite
function describe(name: string, fn: () => void) { console.log(`\nMetric: ${name}`); fn(); }
function it(name: string, fn: () => void) { 
  try { fn(); console.log(`  PASS: ${name}`); } 
  catch (e) { console.error(`  FAIL: ${name}`, e); throw e; } 
}
function expect(val: any) {
  return {
    toBe: (expected: any) => {
      if (val !== expected) throw new Error(`Expected ${expected}, got ${val}`);
    },
    toEqual: (expected: any) => {
      const sVal = JSON.stringify(val);
      const sExp = JSON.stringify(expected);
      if (sVal !== sExp) throw new Error(`Expected ${sExp}, got ${sVal}`);
    }
  }
}

// Tests
describe('Virtualizer Math', () => {

  const virt = new Virtualizer({
    count: 1000,
    getScrollOffset: () => 100,
    getContainerSize: () => 400,
    estimateSize: () => 40, // 40px per item
    overscan: 2
  });

  it('calculates initial range correctly', () => {
    // Scroll 100. Item 40. Start index = floor(100/40) = 2.
    // End index = ceil((100+400)/40) = ceil(12.5) = 13.
    // Overscan 2.
    // Render start = max(0, 2-2) = 0.
    // Render end = min(999, 13+2) = 15.
    
    // Actually:
    // startIndex = 2.
    // endIndex = 13 (inclusive? code says <= renderEndIndex).
    
    const range = virt.calculateRange();
    
    // Index 0 starts at 0.
    // Index 15 starts at 15*40 = 600.
    
    expect(range.startIndex).toBe(0);
    expect(range.endIndex).toBe(15);
  });
});

console.log('Virtualizer verification complete.');
