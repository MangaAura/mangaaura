'use client';

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Edit2, Trash2 } from 'lucide-react';
import { OptimizedImage } from '@/components/Image/OptimizedImage';

export interface PanelText {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  backgroundColor: string;
  borderRadius: number;
  padding: number;
  rotation: number;
  border?: string;
  type: 'speech' | 'thought' | 'narration' | 'sound';
}

interface PanelTextOverlayProps {
  imageUrl: string;
  texts: PanelText[];
  onTextsChange: (texts: PanelText[]) => void;
  isEditing?: boolean;
  readOnly?: boolean;
}

const TEMPLATES: Record<string, Partial<PanelText>> = {
  speech: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    color: '#1a1a1a',
    borderRadius: 50,
    padding: 16,
    fontSize: 16,
    border: '2px solid rgba(0,0,0,0.3)',
  },
  thought: {
    backgroundColor: 'rgba(240,240,240,0.95)',
    color: '#4a4a4a',
    borderRadius: 30,
    padding: 14,
    fontSize: 15,
    border: '2px solid rgba(0,0,0,0.2)',
  },
  narration: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    color: '#ffffff',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  sound: {
    backgroundColor: 'transparent',
    color: '#ef4444',
    borderRadius: 0,
    padding: 8,
    fontSize: 24,
    rotation: -15,
  },
};

export function PanelTextOverlay({
  imageUrl,
  texts,
  onTextsChange,
  isEditing = false,
  readOnly = false,
}: PanelTextOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartOffset = useRef({ x: 0, y: 0 });

  const handleAdd = useCallback((type: PanelText['type']) => {
    const newText: PanelText = {
      id: `text-${Date.now()}`,
      text: type === 'sound' ? '¡BOOM!' : 'Escribe aquí...',
      x: 50,
      y: 50,
      fontSize: TEMPLATES[type].fontSize || 16,
      color: TEMPLATES[type].color || '#1a1a1a',
      backgroundColor: TEMPLATES[type].backgroundColor || 'rgba(255,255,255,0.95)',
      borderRadius: TEMPLATES[type].borderRadius ?? 50,
      padding: TEMPLATES[type].padding ?? 16,
  rotation: TEMPLATES[type].rotation ?? 0,
    border: TEMPLATES[type].border || 'none',
    type,
    };
    onTextsChange([...texts, newText]);
    setActiveId(newText.id);
  }, [texts, onTextsChange]);

  const handleUpdate = useCallback((id: string, updates: Partial<PanelText>) => {
    onTextsChange(texts.map(t => t.id === id ? { ...t, ...updates } : t));
  }, [texts, onTextsChange]);

  const handleDelete = useCallback((id: string) => {
    onTextsChange(texts.filter(t => t.id !== id));
    if (activeId === id) setActiveId(null);
  }, [texts, onTextsChange, activeId]);

  const handleMouseDown = useCallback((e: React.MouseEvent, textId: string) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    
    setActiveId(textId);
    setIsDragging(true);
    
    const text = texts.find(t => t.id === textId);
    if (text && containerRef.current) {
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      dragStartOffset.current = { x: text.x, y: text.y };
    }
  }, [texts, readOnly]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !activeId || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStartPos.current.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStartPos.current.y) / rect.height) * 100;
    
    const newX = Math.max(5, Math.min(95, dragStartOffset.current.x + deltaX));
    const newY = Math.max(5, Math.min(95, dragStartOffset.current.y + deltaY));
    
    handleUpdate(activeId, { x: newX, y: newY });
  }, [isDragging, activeId, handleUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTextChange = useCallback((id: string, newText: string) => {
    handleUpdate(id, { text: newText });
  }, [handleUpdate]);

  const activeText = texts.find(t => t.id === activeId);

  return (
    <div 
      ref={containerRef} 
      className="relative select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: '2/3' }}>
        <OptimizedImage 
          src={imageUrl} 
          alt="Panel" 
          fill
          objectFit="contain"
          className="rounded-lg"
          crossOrigin="anonymous"
        />
      </div>
      
      {texts.map((text) => (
        <div
          key={text.id}
          className={cn(
            "absolute transform -translate-x-1/2 -translate-y-1/2",
            activeId === text.id && "z-50",
            !readOnly && !isEditing && "cursor-move",
            isEditing && activeId === text.id && "ring-2 ring-accent-blue ring-offset-2"
          )}
          style={{
            left: `${text.x}%`,
            top: `${text.y}%`,
          }}
          onMouseDown={(e) => handleMouseDown(e, text.id)}
          onClick={() => setActiveId(text.id)}
        >
          <div
            className={cn(
              "relative min-w-[100px] max-w-[280px] text-center font-bold shadow-lg transition-shadow",
              text.type === 'sound' && "font-black uppercase",
              isEditing && activeId === text.id && "cursor-text"
            )}
            style={{
              backgroundColor: text.backgroundColor,
              color: text.color,
              borderRadius: `${text.borderRadius}px`,
              padding: `${text.padding}px`,
              fontSize: `${text.fontSize}px`,
          transform: `rotate(${text.rotation}deg)`,
          ...(text.border && text.border !== 'none' ? { border: text.border } : {}),
        }}
          >
            {/* Speech/Thought bubble tail */}
            {(text.type === 'speech' || text.type === 'thought') && (
              <div 
                className="absolute -bottom-3 left-1/2 transform -translate-x-1/2"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: `12px solid ${text.backgroundColor}`,
                }}
              />
            )}
            
            {/* Editable or display text */}
            {isEditing && activeId === text.id ? (
              <textarea
                value={text.text}
                onChange={(e) => handleTextChange(text.id, e.target.value)}
                className="bg-transparent w-full min-h-[60px] resize-none text-center focus:outline-none"
                style={{ color: text.color }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="whitespace-pre-wrap">{text.text}</div>
            )}
            
            {/* Edit indicator */}
            {isEditing && activeId === text.id && !isDragging && (
              <div className="absolute -top-2 -right-2 flex gap-1">
                <div className="bg-accent-blue text-[var(--text-inverse)] p-1 rounded-full">
                  <Edit2 size={12} />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Editing controls panel */}
      {isEditing && !readOnly && (
        <>
          {/* Add bubbles menu */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 bg-[var(--surface-sunken)]/95 backdrop-blur rounded-xl p-3 shadow-xl">
            <span className="text-xs text-[var(--text-inverse)]/70 font-medium">Añadir viñeta</span>
            <button 
              onClick={() => handleAdd('speech')} 
              className="text-[var(--text-inverse)] text-sm px-3 py-2 hover:bg-[var(--text-inverse)]/10 rounded flex items-center gap-2 transition-colors"
            >
              <span className="w-3 h-3 rounded-full bg-[var(--text-inverse)]"></span>
              Diálogo
            </button>
            <button 
              onClick={() => handleAdd('thought')} 
              className="text-[var(--text-inverse)] text-sm px-3 py-2 hover:bg-[var(--text-inverse)]/10 rounded flex items-center gap-2 transition-colors"
            >
              <span className="w-3 h-3 rounded-full border-2 border-[var(--text-inverse)]/70 border-dashed"></span>
              Pensamiento
            </button>
            <button 
              onClick={() => handleAdd('narration')} 
              className="text-[var(--text-inverse)] text-sm px-3 py-2 hover:bg-[var(--text-inverse)]/10 rounded flex items-center gap-2 transition-colors"
            >
              <span className="w-3 h-3 bg-black border border-white/50"></span>
              Narración
            </button>
            <button 
              onClick={() => handleAdd('sound')} 
              className="text-[var(--text-inverse)] text-sm px-3 py-2 hover:bg-[var(--text-inverse)]/10 rounded flex items-center gap-2 transition-colors"
            >
              <span className="text-[var(--error)] font-bold">!</span>
              Sonido
            </button>
          </div>

          {/* Active text controls */}
          {activeText && (
            <div className="absolute top-4 right-4 flex flex-col gap-2 bg-[var(--surface-sunken)]/95 backdrop-blur rounded-xl p-3 shadow-xl min-w-[200px]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-inverse)]/70 font-medium">Editar viñeta</span>
                <button 
                  onClick={() => handleDelete(activeText.id)}
                  className="p-1 hover:bg-[var(--error)] rounded text-[var(--text-inverse)] transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              
              {/* Font size */}
              <div className="space-y-1">
                <label className="text-xs text-[var(--text-inverse)]/50">Tamaño</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="48"
                    value={activeText.fontSize}
                    onChange={(e) => handleUpdate(activeText.id, { fontSize: parseInt(e.target.value) })}
                    aria-label="Tamaño de fuente"
                    className="flex-1"
                  />
                  <span className="text-xs text-[var(--text-inverse)] w-8">{activeText.fontSize}px</span>
                </div>
              </div>

              {/* Rotation */}
              <div className="space-y-1">
                <label className="text-xs text-[var(--text-inverse)]/50">Rotación</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    value={activeText.rotation}
                    onChange={(e) => handleUpdate(activeText.id, { rotation: parseInt(e.target.value) })}
                    aria-label="Rotación"
                    className="flex-1"
                  />
                  <span className="text-xs text-[var(--text-inverse)] w-8">{activeText.rotation}°</span>
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-1">
                <label className="text-xs text-[var(--text-inverse)]/50">Colores</label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-xs text-[var(--text-inverse)]/50">T</span>
                    <input
                      type="color"
                      value={activeText.color}
                      onChange={(e) => handleUpdate(activeText.id, { color: e.target.value })}
                      aria-label="Color de texto"
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-xs text-[var(--text-inverse)]/50">F</span>
                    <input
                      type="color"
                      value={activeText.backgroundColor.startsWith('rgba') ? '#ffffff' : activeText.backgroundColor}
                      onChange={(e) => {
                        const color = e.target.value;
                        const r = parseInt(color.slice(1, 3), 16);
                        const g = parseInt(color.slice(3, 5), 16);
                        const b = parseInt(color.slice(5, 7), 16);
                        handleUpdate(activeText.id, { 
                          backgroundColor: activeText.type === 'narration' 
                            ? `rgba(${r},${g},${b},0.85)` 
                            : `rgba(${r},${g},${b},0.95)` 
                        });
                      }}
                      aria-label="Color de fondo"
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Border radius for speech/thought */}
              {(activeText.type === 'speech' || activeText.type === 'thought') && (
                <div className="space-y-1">
                  <label className="text-xs text-[var(--text-inverse)]/50">Redondez</label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={activeText.borderRadius}
                    onChange={(e) => handleUpdate(activeText.id, { borderRadius: parseInt(e.target.value) })}
                    aria-label="Redondez de borde"
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PanelTextOverlay;
