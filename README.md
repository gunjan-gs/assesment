
# Advanced DataGrid — Design System Primitive

A production-grade **DataGrid component** built as a **design-system primitive**, focused on performance, accessibility, correctness, and architectural clarity — not UI styling.

This component is capable of handling **50,000+ rows** with strict guarantees around:

- Manual row & column virtualization
- Sticky headers and pinned columns
- Deterministic multi-column sorting
- Column resize, reorder, visibility control
- In-cell editing with optimistic UI and rollback
- Full keyboard-first interaction model
- Screen reader parity with visual UX
- 60 FPS scrolling (measured and reported)

---

## Links

- GitHub Repo: [Add your link]
- Storybook Preview: [Add your link]
- Chromatic Build: [Add your link]

---

## Tech Stack

- React 18
- TypeScript (strict mode enabled)
- Tailwind CSS (utility-first + design tokens)
- Storybook + Chromatic
- Vite
- Testing Library + axe (a11y)

---

## Architecture Overview

```
src/
 ├ core/
 ├ virtualization/
 ├ layout/
 ├ a11y/
 └ DataGrid/
```

---

## Virtualization Strategy

### Row Virtualization

```
visibleStart = scrollTop / rowHeight
visibleEnd   = visibleStart + viewportHeight / rowHeight
```

### Column Virtualization

Uses cumulative column widths and `scrollLeft` to render only visible columns.

---

## Accessibility

- ARIA grid roles
- Keyboard-first navigation
- Screen reader announcements
- axe tested

---

## Storybook Coverage

- 50k rows demo
- Pinned columns
- Resize & reorder
- Editing failure
- Keyboard-only usage
- High contrast mode

---

## Performance

Measured via Chrome Performance tools:
- ~60 FPS on scroll
- No layout shifts
- Minimal memory usage

---

## Run Locally

```bash
npm install
npm run dev
npm run storybook
```
