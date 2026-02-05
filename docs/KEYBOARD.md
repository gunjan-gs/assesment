# DataGrid Keyboard Interaction Contract

This document defines the keyboard interaction model for the DataGrid component, adhering to the [ARIA Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) and industry standards (e.g., Excel/Sheets).

## Focus Management

- **Roving Tabindex**: The grid maintains a single focusable element (`tabindex="0"`) while all other cells have `tabindex="-1"`. This allows the user to tab *into* the grid, navigate with arrow keys, and tab *out* of the grid with a single Tab press.
- **Initial Focus**: When the grid receives focus, the first cell (0,0) or the last focused cell is activated.

## Navigation Keys

| Key | Action | Behavior Detail |
| :--- | :--- | :--- |
| `ArrowRight` | Focus Next Column | Moves focus one cell to the right. Stops at the last column. |
| `ArrowLeft` | Focus Previous Column | Moves focus one cell to the left. Stops at the first column. |
| `ArrowDown` | Focus Next Row | Moves focus one cell down. Stops at the last row. |
| `ArrowUp` | Focus Previous Row | Moves focus one cell up. Stops at the first row. |
| `Home` | Focus First Row | Moves focus to the first row in the current column. |
| `End` | Focus Last Row | Moves focus to the last row in the current column. |
| `PageUp` | Page Up | Scrolls up by one viewport height and moves focus accordingly. |
| `PageDown` | Page Down | Scrolls down by one viewport height and moves focus accordingly. |
| `Ctrl` + `Home` | Focus First Cell | Moves focus to the very first cell (0,0). |
| `Ctrl` + `End` | Focus Last Cell | Moves focus to the very last cell (last row, last column). |

## Editing Interaction

| Key | Action | Behavior Detail |
| :--- | :--- | :--- |
| `Enter` | Enter Edit Mode | If cell is editable, switches to edit mode. Focus moves to input. |
| `Enter` (in Edit) | Commit & Next Row | Saves value, exits edit mode, and moves focus to the cell below. |
| `Shift` + `Enter` | Commit & Prev Row | Saves value, exits edit mode, and moves focus to the cell above. |
| `Tab` (in Edit) | Commit & Next Col | Saves value, exits edit mode, and moves focus to the next column. |
| `Shift` + `Tab` | Commit & Prev Col | Saves value, exits edit mode, and moves focus to the previous column. |
| `Escape` | Cancel Edit | Discards changes and exits edit mode. Focus returns to the cell. |
| `F2` | Toggle Edit Mode | Enters edit mode with cursor at the end of the text. |

## Selection (Future Scope)

| Key | Action | Behavior Detail |
| :--- | :--- | :--- |
| `Space` | Select Row | Toggles selection of the current row. |
| `Shift` + `Arrow` | Range Selection | Extends selection from the anchor cell to the target cell. |
| `Ctrl` + `A` | Select All | Selects all rows in the grid. |

## Accessibility (ARIA)

- **`role="grid"`**: The container element.
- **`role="rowgroup"`**: The header and body containers.
- **`role="row"`**: Each row element (header and body).
- **`role="columnheader"`**: Header cells.
- **`role="gridcell"`**: Body cells.
- **`aria-rowindex`**: Explicit row index for virtualization support.
- **`aria-colindex`**: Explicit column index for virtualization support.
- **`aria-selected`**: Indicates selection state.
- **`aria-sort`**: Indicates sort direction on column headers.
