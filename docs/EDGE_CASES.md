# DataGrid Edge Cases & Stress Scenarios (50k+ Rows)

This document outlines critical edge cases and stress scenarios identified for the 50,000+ row DataGrid implementation. These scenarios guide development, testing, and validation.

## 1. Virtualization & Scrolling

- **Rapid Scrolling (Fling)**: Scrolling from row 0 to 50,000 instantly.
  - *Risk*: White screen / blank content if virtualization buffer isn't sufficient or render loop is too slow.
  - *Mitigation*: Optimized O(1) binary search or math-based offset calculation; `overscan` buffer (e.g., 5 rows).
- **Variable Scroll Direction**: Rapidly changing scroll direction up/down.
  - *Risk*: Jittery offsets or "tearing" of sticky elements.
  - *Mitigation*: Synchronous scroll handling or `requestAnimationFrame` syncing.
- **Scroll to Bottom Exactness**: Ensuring the last row is fully visible and not cut off.
  - *Risk*: Calculation errors with `totalHeight` vs `scrollTop`.
- **Viewport Resizing**: Resizing the browser window while scrolled to row 25,000.
  - *Risk*: Visible range calculation becomes stale; content disappears.
  - *Mitigation*: `ResizeObserver` triggering layout recalculation.

## 2. Column Management

- **All Columns Hidden**: User toggles visibility off for ALL columns.
  - *Risk*: Grid collapses to 0 width or throws error.
  - *Mitigation*: Prevent hiding the last column OR display a "No columns visible" empty state.
- **Zero Width Columns**: Resizing a column to 0px.
  - *Risk*: Content overflow or calculation errors (division by zero).
  - *Mitigation*: Enforce `minWidth` (e.g., 50px).
- **Pinned Column Overflow**: Pinning so many columns that they exceed the viewport width.
  - *Risk*: Unpinned columns become inaccessible; sticky layering breaks.
  - *Mitigation*: Limit pinned columns or allow horizontal scroll within pinned area (complex).
- **Reordering Pinned Columns**: Dragging a pinned column into the unpinned area or vice versa.
  - *Risk*: State corruption (pinned status vs order index).

## 3. Data & State

- **Empty Dataset**: `rows` array is empty.
  - *Risk*: Header rendering crashes or division by zero in scrollbar math.
  - *Mitigation*: Render empty state overlay.
- **Null/Undefined Values**: Data cells containing `null` or `undefined`.
  - *Risk*: Render errors or sorting crashes.
  - *Mitigation*: Robust cell renderer and sort comparator.
- **Duplicate IDs**: `getRowId` returning duplicates.
  - *Risk*: React key collisions, unpredictable selection/editing behavior.
  - *Mitigation*: Warn in console; enforce uniqueness.
- **Rapid Data Updates**: `rows` prop changing frequently (e.g., WebSocket feed) while scrolling.
  - *Risk*: Scroll position jumping (scroll anchoring problem).
  - *Mitigation*: Preserve scroll position relative to `scrollTop` or top-most visible item.

## 4. Interaction & Editing

- **Editing Scrolled-Out Cell**: Editing a cell, then scrolling it out of view.
  - *Risk*: Input remains floating in wrong position or state is lost.
  - *Mitigation*: Close editor on scroll OR stick editor to virtualized slot (hard). Recommended: Commit/Cancel on scroll.
- **Async Validation Race Conditions**: Editing Cell A, triggering async check, then quickly moving to Cell B.
  - *Risk*: Validation result for A overwrites B's state.
  - *Mitigation*: Unique request IDs or cancelling stale validation promises.
- **Keyboard Navigation at Boundaries**: Pressing `ArrowRight` at the very last column.
  - *Risk*: Focus loss or error.
  - *Mitigation*: Clamp index logic.

## 5. Performance Limits

- **100+ Columns**: Rendering 50k rows is one thing; 50k rows * 100 columns is 5M cells.
  - *Risk*: DOM node count explosion even with row virtualization if column virtualization is missing.
  - *Mitigation*: Implement **2D Virtualization** (both rows and columns).
- **Complex Cell Renderers**: Using heavy components (charts, images) inside cells.
  - *Risk*: FPS drop during scroll.
  - *Mitigation*: Memoization (`React.memo`) for cells; lightweight placeholders during scroll.
