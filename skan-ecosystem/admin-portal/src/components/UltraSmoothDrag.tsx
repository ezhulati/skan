/**
 * ULTRA SMOOTH DRAG SYSTEM - ZERO JANK
 * Built for 60fps performance with GPU acceleration
 */

import React, { useCallback, useRef, useEffect } from 'react';

interface SmoothDragProps {
  children: React.ReactNode;
  onDragEnd?: (startPos: { x: number; y: number }, endPos: { x: number; y: number }) => void;
  draggable?: boolean;
}

export const UltraSmoothDrag: React.FC<SmoothDragProps> = ({ 
  children, 
  onDragEnd, 
  draggable = true 
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    originalTransform: ''
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!draggable || !elementRef.current) return;
    
    e.preventDefault();
    const element = elementRef.current;
    const rect = element.getBoundingClientRect();
    
    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      originalTransform: element.style.transform || ''
    };
    
    // PERFORMANCE: GPU acceleration with minimal styles
    element.style.willChange = 'transform';
    element.style.userSelect = 'none';
    element.style.pointerEvents = 'none';
    element.style.zIndex = '9999';
    element.style.transition = 'none';
    
    console.log('🚀 ULTRA SMOOTH DRAG START');
  }, [draggable]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStateRef.current.isDragging || !elementRef.current) return;
    
    const { startX, startY } = dragStateRef.current;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    // CRITICAL: Use translate3d for GPU acceleration - this is the key to smoothness
    elementRef.current.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
    
    dragStateRef.current.currentX = e.clientX;
    dragStateRef.current.currentY = e.clientY;
  }, []);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragStateRef.current.isDragging || !elementRef.current) return;
    
    const element = elementRef.current;
    const { startX, startY, currentX, currentY } = dragStateRef.current;
    
    // Notify parent of drag end
    if (onDragEnd) {
      onDragEnd(
        { x: startX, y: startY },
        { x: currentX, y: currentY }
      );
    }
    
    // PERFORMANCE: Clean reset
    element.style.willChange = 'auto';
    element.style.userSelect = '';
    element.style.pointerEvents = '';
    element.style.zIndex = '';
    element.style.transition = 'transform 0.2s ease';
    element.style.transform = dragStateRef.current.originalTransform;
    
    // Reset state
    dragStateRef.current.isDragging = false;
    
    console.log('✅ ULTRA SMOOTH DRAG END');
  }, [onDragEnd]);

  // Global event listeners for smooth tracking
  useEffect(() => {
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      e.preventDefault();
      handleMouseMove(e);
    };
    
    const handleMouseUpGlobal = (e: MouseEvent) => {
      handleMouseUp(e);
    };

    if (dragStateRef.current.isDragging) {
      document.addEventListener('mousemove', handleMouseMoveGlobal, { passive: false });
      document.addEventListener('mouseup', handleMouseUpGlobal);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMoveGlobal);
        document.removeEventListener('mouseup', handleMouseUpGlobal);
      };
    }
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={elementRef}
      onMouseDown={handleMouseDown}
      style={{
        cursor: draggable ? 'grab' : 'default',
        touchAction: 'none', // Prevent scrolling on touch
        transform: 'translate3d(0,0,0)', // Force GPU layer
      }}
    >
      {children}
    </div>
  );
};