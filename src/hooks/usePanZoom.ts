'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UsePanZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  enablePan?: boolean;
  enableWheel?: boolean;
}

interface UsePanZoomReturn {
  zoom: number;
  position: Position;
  isDragging: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setZoom: (zoom: number) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleWheel: (e: React.WheelEvent) => void;
  getTransformStyle: () => React.CSSProperties;
}

export function usePanZoom({
  minZoom = 0.5,
  maxZoom = 4,
  zoomStep = 0.25,
  enablePan = true,
  enableWheel = true,
}: UsePanZoomOptions = {}): UsePanZoomReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoomState] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<Position>({ x: 0, y: 0 });
  const initialPosition = useRef<Position>({ x: 0, y: 0 });

  const clampZoom = useCallback((value: number) => {
    return Math.min(Math.max(value, minZoom), maxZoom);
  }, [minZoom, maxZoom]);

  const zoomIn = useCallback(() => {
    setZoomState(prev => clampZoom(prev + zoomStep));
  }, [clampZoom, zoomStep]);

  const zoomOut = useCallback(() => {
    setZoomState(prev => clampZoom(prev - zoomStep));
  }, [clampZoom, zoomStep]);

  const resetZoom = useCallback(() => {
    setZoomState(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const setZoom = useCallback((newZoom: number) => {
    setZoomState(clampZoom(newZoom));
  }, [clampZoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enablePan || zoom <= 1) return;
    
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPosition.current = { ...position };
  }, [enablePan, zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !enablePan) return;
    
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;
    
    setPosition({
      x: initialPosition.current.x + deltaX,
      y: initialPosition.current.y + deltaY,
    });
  }, [isDragging, enablePan]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!enableWheel) return;
    
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
      setZoomState(prev => clampZoom(prev + delta));
    }
  }, [enableWheel, zoomStep, clampZoom]);

  // Global mouse up handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Constrain pan within bounds
  useEffect(() => {
    if (zoom <= 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPosition({ x: 0, y: 0 });
    }
  }, [zoom]);

  const getTransformStyle = useCallback((): React.CSSProperties => ({
    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
    transformOrigin: 'center center',
    cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
  }), [position, zoom, isDragging]);

  return {
    zoom,
    position,
    isDragging,
    containerRef,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    getTransformStyle,
  };
}
