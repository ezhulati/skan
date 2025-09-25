/**
 * BULLETPROOF DRAG SYSTEM - ZERO GLITCHES GUARANTEED
 * Uses DOM cloning to completely avoid React interference
 */

import React, { useRef, useCallback, useEffect } from 'react';

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  dragClone?: HTMLElement;
  originalElement?: HTMLElement;
  startRect?: DOMRect;
  orderId?: string;
  fromStatus?: string;
}

interface BulletproofDragProps {
  orderId: string;
  status: string;
  children: React.ReactNode;
  onDragEnd: (orderId: string, fromStatus: string, dropTarget: HTMLElement | null) => void;
}

export const BulletproofDrag: React.FC<BulletproofDragProps> = ({
  orderId,
  status,
  children,
  onDragEnd
}) => {
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0
  });
  
  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!elementRef.current) return;
    
    // CRITICAL FIX: Don't start drag on button clicks - expanded detection
    const target = e.target as HTMLElement;
    const isButton = target.tagName === 'BUTTON' || 
                     target.closest('button') !== null ||
                     target.classList.contains('status-button') ||
                     target.classList.contains('status-button-clean') ||
                     target.hasAttribute('data-button') ||
                     target.className.includes('button');
    
    console.log('🔍 Mouse down target analysis:', {
      tagName: target.tagName,
      className: target.className,
      classList: Array.from(target.classList),
      isButton: isButton,
      closestButton: target.closest('button')?.className
    });
    
    if (isButton) {
      console.log('🚫 Mouse down on button - skipping drag initialization');
      // Don't call preventDefault or stopPropagation to allow button click
      return;
    }
    
    console.log('✅ Mouse down on draggable area - initializing drag');
    e.preventDefault();
    e.stopPropagation();
    
    const element = elementRef.current;
    const rect = element.getBoundingClientRect();
    
    console.log('🔥 BULLETPROOF DRAG START:', orderId);
    
    // Create perfect clone for dragging
    const dragClone = element.cloneNode(true) as HTMLElement;
    
    // CRITICAL: Apply dark mode styles to clone since React state isn't preserved
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (isDarkMode) {
      console.log('🌙 Applying dark mode styles to drag clone...');
      
      // AGGRESSIVE: Apply dark mode to ALL elements in the clone
      const allElements = dragClone.querySelectorAll('*');
      allElements.forEach(el => {
        const element = el as HTMLElement;
        
        // Force dark backgrounds on any white/light elements
        const currentBg = window.getComputedStyle(element).backgroundColor;
        if (currentBg === 'rgb(255, 255, 255)' || 
            currentBg === 'white' || 
            currentBg === 'rgba(0, 0, 0, 0)' || 
            currentBg === 'transparent') {
          element.style.backgroundColor = '#374151 !important';
        }
        
        // Force light text on any dark text
        const currentColor = window.getComputedStyle(element).color;
        if (currentColor === 'rgb(31, 41, 55)' || 
            currentColor === '#1f2937' ||
            currentColor === 'rgb(0, 0, 0)' ||
            currentColor === 'black') {
          element.style.color = '#f9fafb !important';
        }
      });
      
      // Specifically target the main card container
      const mainCard = dragClone.querySelector('.order-card') as HTMLElement;
      if (mainCard) {
        mainCard.style.setProperty('background-color', '#374151', 'important');
        mainCard.style.setProperty('color', '#f9fafb', 'important');
        mainCard.style.setProperty('border-color', '#4b5563', 'important');
      }
      
      // Force the entire clone to have dark styling
      dragClone.style.setProperty('background-color', '#374151', 'important');
      dragClone.style.setProperty('color', '#f9fafb', 'important');
      
      // Apply a dark theme class to override any CSS
      dragClone.classList.add('dark-mode-clone');
      
      // Inject aggressive CSS for the clone
      const style = document.createElement('style');
      style.textContent = `
        .dark-mode-clone,
        .dark-mode-clone * {
          background-color: #374151 !important;
          color: #f9fafb !important;
          border-color: #4b5563 !important;
        }
        .dark-mode-clone .order-card {
          background-color: #374151 !important;
          color: #f9fafb !important;
        }
      `;
      document.head.appendChild(style);
      
      // Clean up style after drag
      setTimeout(() => {
        document.head.removeChild(style);
      }, 5000);
      
      console.log('🌙 Applied comprehensive dark mode styles to drag clone');
    }
    
    // COMPLETELY HIDE original element - ZERO VISUAL ARTIFACTS!
    element.style.opacity = '0';
    element.style.visibility = 'hidden';
    element.style.display = 'none'; // CRITICAL: Completely remove from layout
    element.style.transform = 'scale(0)'; // Extra insurance
    element.style.zIndex = '-9999'; // Send far behind
    element.style.transition = 'none'; // No transition to avoid flicker
    element.style.boxShadow = 'none'; // Remove all shadows
    element.style.border = 'none'; // Remove all borders
    element.style.outline = 'none'; // Remove outline
    element.style.filter = 'opacity(0)'; // Extra opacity filter
    
    // Position clone exactly over original - LOOK IDENTICAL TO ORIGINAL
    dragClone.style.position = 'fixed';
    dragClone.style.left = rect.left + 'px';
    dragClone.style.top = rect.top + 'px';
    dragClone.style.width = rect.width + 'px';
    dragClone.style.height = rect.height + 'px';
    dragClone.style.zIndex = '999999';
    dragClone.style.pointerEvents = 'none';
    dragClone.style.transform = 'translate3d(0,0,0)';
    dragClone.style.willChange = 'transform';
    dragClone.style.transition = 'none';
    // KEEP ORIGINAL APPEARANCE - NO EXTRA EFFECTS!
    dragClone.style.opacity = '1'; // Same as original
    // DON'T override boxShadow, borderRadius, etc. - keep original styles
    dragClone.style.cursor = 'grabbing';
    
    document.body.appendChild(dragClone);
    
    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      dragClone,
      originalElement: element,
      startRect: rect,
      orderId,
      fromStatus: status
    };
    
    console.log('✅ Clone created and positioned');
  }, [orderId, status]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const dragState = dragStateRef.current;
    if (!dragState.isDragging || !dragState.dragClone) return;
    
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    
    // ULTRA SMOOTH: Direct transform on clone - SAME SIZE AS ORIGINAL
    dragState.dragClone.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
    
    // Highlight drop zones
    const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
    const dropZone = elementBelow?.closest('.station-lane') || elementBelow?.closest('[data-station]');
    
    // Reset all zones
    document.querySelectorAll('.station-lane, [data-station]').forEach(zone => {
      (zone as HTMLElement).style.backgroundColor = '';
    });
    
    // Highlight current zone
    if (dropZone && dropZone !== dragState.originalElement?.closest('.station-lane')) {
      (dropZone as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
    }
  }, []);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    console.log('🎯 BULLETPROOF DRAG END - handleMouseUp called');
    const dragState = dragStateRef.current;
    
    console.log('📊 Drag state on mouse up:', {
      isDragging: dragState.isDragging,
      hasClone: !!dragState.dragClone,
      hasOriginal: !!dragState.originalElement,
      orderId: dragState.orderId,
      fromStatus: dragState.fromStatus
    });
    
    if (!dragState.isDragging || !dragState.dragClone || !dragState.originalElement) {
      console.log('⚠️ Early return from handleMouseUp - missing required state');
      return;
    }
    
    // Find drop target
    const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
    console.log('📍 Element below mouse:', elementBelow?.tagName, elementBelow?.className);
    
    const dropTarget = elementBelow?.closest('.station-lane') || elementBelow?.closest('[data-station]');
    console.log('🎯 Drop target found:', dropTarget?.tagName, dropTarget?.getAttribute('data-station'));
    
    // Clean up clone
    document.body.removeChild(dragState.dragClone);
    
    // COMPLETELY RESTORE original element - UNDO ALL HIDING
    dragState.originalElement.style.opacity = '1';
    dragState.originalElement.style.visibility = 'visible';
    dragState.originalElement.style.display = ''; // Restore display
    dragState.originalElement.style.transform = ''; // Restore scale
    dragState.originalElement.style.zIndex = ''; // Restore z-index
    dragState.originalElement.style.transition = '';
    dragState.originalElement.style.position = '';
    dragState.originalElement.style.left = '';
    dragState.originalElement.style.top = '';
    dragState.originalElement.style.width = '';
    dragState.originalElement.style.height = '';
    dragState.originalElement.style.pointerEvents = '';
    dragState.originalElement.style.willChange = '';
    dragState.originalElement.style.boxShadow = ''; // Restore shadows
    dragState.originalElement.style.border = ''; // Restore borders
    dragState.originalElement.style.outline = ''; // Restore outline
    dragState.originalElement.style.filter = ''; // Restore filters
    
    console.log('✅ Original element fully restored to normal state');
    
    // Reset all zones
    document.querySelectorAll('.station-lane, [data-station]').forEach(zone => {
      (zone as HTMLElement).style.backgroundColor = '';
    });
    
    // Force layout reflow to prevent stacking issues
    setTimeout(() => {
      document.querySelectorAll('.order-card').forEach(card => {
        const element = card as HTMLElement;
        element.style.position = '';
        element.style.transform = '';
        element.style.zIndex = '';
        element.style.left = '';
        element.style.top = '';
      });
      console.log('🔄 Forced layout reset on all cards');
    }, 50);
    
    // Notify parent
    if (dragState.orderId && dragState.fromStatus) {
      console.log('🚀 Calling onDragEnd with:', { orderId: dragState.orderId, fromStatus: dragState.fromStatus, dropTarget });
      onDragEnd(dragState.orderId, dragState.fromStatus, dropTarget as HTMLElement);
    } else {
      console.log('⚠️ Missing orderId or fromStatus for onDragEnd');
    }
    
    dragStateRef.current.isDragging = false;
  }, [onDragEnd]);

  // Global event listeners - attach once and check dragging state in handlers
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (dragStateRef.current.isDragging) {
        e.preventDefault();
        handleMouseMove(e);
      }
    };
    
    const handleUp = (e: MouseEvent) => {
      if (dragStateRef.current.isDragging) {
        console.log('🎯 Global mouseup handler called - dragging is active');
        handleMouseUp(e);
      }
    };
    
    console.log('🔧 Attaching global mouse event listeners');
    document.addEventListener('mousemove', handleMove, { passive: false });
    document.addEventListener('mouseup', handleUp);
    
    return () => {
      console.log('🔧 Removing global mouse event listeners');
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={elementRef}
      onMouseDown={handleMouseDown}
      style={{
        cursor: 'grab',
        touchAction: 'none',
        userSelect: 'none'
      }}
    >
      {children}
    </div>
  );
};