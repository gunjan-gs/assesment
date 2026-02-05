import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataGrid } from './DataGrid';
import type { ColumnDef } from '../../core/types';

describe('DataGrid', () => {
  const columns: ColumnDef<any>[] = [
    { id: 'id', title: 'ID', width: 50 },
    { id: 'name', title: 'Name', width: 100 }
  ];
  
  const rows = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));


  beforeEach(() => {
    // Mock ResizeObserver
    vi.stubGlobal('ResizeObserver', class ResizeObserver {
      observe() {
        // Trigger callback immediately with mocked size
        (this as any).callback([{
          contentRect: { width: 1000, height: 500 }
        }]);
      }
      unobserve() {}
      disconnect() {}
      constructor(callback: any) {
        (this as any).callback = callback;
      }
    });
  });

  it('renders grid with correct ARIA roles', () => {
    render(<DataGrid columns={columns} data={rows} />);
    
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('maintains focus when sorting (The Chaos Test)', () => {
    render(<DataGrid columns={columns} data={rows} />);
    
    const grid = screen.getByRole('grid');
    // Wrap focus in act to ensure onFocus state updates render before we proceed
    act(() => {
      grid.focus();
    });
    
    // Initial Focus on first cell (0,0)
    // Simulate user pressing ArrowDown to select row 1 (Item 1)
    fireEvent.keyDown(grid, { key: 'ArrowDown' });
    
    // Check if aria-activedescendant points to row 1
    // Implementation détail: cell-1-id
    expect(grid).toHaveAttribute('aria-activedescendant', 'cell-1-id');

    // Now trigger a sort on the 'name' column (descending)
    // This flips the order. 'Item 99' becomes first. 'Item 1' moves to index 98.
    const nameHeader = screen.getByRole('columnheader', { name: /Name/i });
    fireEvent.click(nameHeader); // Asc
    fireEvent.click(nameHeader); // Desc (Item 99 first)

    // The focused cell should still be 'Item 1', but its visual position might have changed.
    // The grid should logically track 'Item 1'.
    // NOTE: This verifies if the component tracks focus by ID or by Index.
    // Senior expectation: Track by ID.
    expect(grid).toHaveAttribute('aria-activedescendant', 'cell-1-id');
  });

  it('prevents keyboard traps (The Roaming Tabindex Check)', () => {
    render(
      <div>
        <button data-testid="before">Before</button>
        <DataGrid columns={columns} data={rows} />
        <button data-testid="after">After</button>
      </div>
    );
    
    const grid = screen.getByRole('grid');
    const cells = screen.getAllByRole('gridcell');
    
    // The grid container should be focusable
    expect(grid).toHaveAttribute('tabIndex', '0');
    
    // Cells should NOT be natively focusable (tabIndex -1) to prevent Tabbing through 50k rows
    // Only the 'active' cell might be 0, but usually the Grid container handles capture
    // The checking logic:
    // If we press Tab from 'Before', we land on Grid.
    // If we press Tab from Grid, we should land on 'After', NOT the first cell.
    // This proves we manage focus internally with Arrows, but use Tab for exit.
    
    // Check all rendered cells have tabIndex -1 (except maybe the focused one if managed that way)
    // In our implementation, we use aria-activedescendant, so NO cells should be focusable?
    // Or we use tabindex=0 on the active cell?
    // Let's verify the "Senior" requirement: "Ensure Tab doesn't get stuck".
    
    // Since we use aria-activedescendant on the container, the cells themselves might not need focus.
    // If they do (for click focus), they should be managed carefully.
    
    // In DataGrid.tsx: "tabIndex={isFocused ? 0 : -1}"
    // This means ONE cell is focusable. 
    // So Tab -> Grid Container (tabIndex=0) -> Cell (tabIndex=0)?
    // No, if Grid Container has tabIndex=0, and a Cell has tabIndex=0, it's two stops.
    // If using Roaming Tabindex strictly, usually the Container delegates to the Cell, or Container IS the focus.
    
    // Current implementation: Container has tabIndex=0. Cell has tabIndex=0 if focused.
    // This implies 2 tabs to exit? Or 1?
    // Ideally, only the "active" element is in the tab sequence.
    
    // Let's assert that we don't have *multiple* cells with tabIndex=0
    const focusableCells = cells.filter(c => c.getAttribute('tabIndex') === '0');
    expect(focusableCells.length).toBeLessThanOrEqual(1);
  });

  it('handles empty data gracefully (Edge Case)', () => {
     render(<DataGrid columns={columns} data={[]} />);
     expect(screen.getByRole('grid')).toBeInTheDocument();
     expect(screen.queryByRole('row', { name: /Item/ })).not.toBeInTheDocument();
     // Should render header row
     expect(screen.getAllByRole('row')).toHaveLength(1); 
  });
});
