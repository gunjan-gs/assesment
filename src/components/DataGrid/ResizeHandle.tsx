import React, { useState } from 'react';
import { useStore } from './context';
import { clsx } from 'clsx';

interface ResizeHandleProps {
  columnId: string;
  width: number;
}

export function ResizeHandle({ columnId, width }: ResizeHandleProps) {
  const store = useStore();
  const [isResizing, setIsResizing] = useState(false);

  // We need to track the initial X position and initial width
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = width;
    
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = startWidth + deltaX;
      
      // Update store directly
      // Note: We might want to throttle this if performance degrades
      store.resizeColumn(columnId, newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={clsx(
        "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 z-50 transition-colors",
        isResizing ? "bg-blue-500 w-1.5" : "bg-transparent"
      )}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()} // Prevent sort trigger
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={width}
    />
  );
}
