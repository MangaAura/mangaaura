'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Download, Share2, Type, Image as ImageIcon, X } from 'lucide-react';
import html2canvas from 'html2canvas';

interface MemeGeneratorProps {
  imageUrl: string;
  panelId: string;
  onClose: () => void;
  mangaTitle: string;
  chapterNumber: number;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  isDragging: boolean;
}

const MEME_TEMPLATES = [
  { id: 'drake', name: 'Drake Hotline Bling', top: '', bottom: '' },
  { id: 'distracted', name: 'Distracted Boyfriend', top: '', bottom: '' },
  { id: 'expanding', name: 'Expanding Brain', top: '', bottom: '' },
  { id: 'change', name: 'Change My Mind', top: '', bottom: '' },
];

export function MemeGenerator({ imageUrl, panelId, onClose, mangaTitle, chapterNumber }: MemeGeneratorProps) {
  const [texts, setTexts] = useState<TextOverlay[]>([
    { id: '1', text: 'Texto superior', x: 50, y: 10, fontSize: 32, color: '#ffffff', isDragging: false },
    { id: '2', text: 'Texto inferior', x: 50, y: 85, fontSize: 32, color: '#ffffff', isDragging: false },
  ]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateText = useCallback((id: string, updates: Partial<TextOverlay>) => {
    setTexts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const addText = useCallback(() => {
    const newId = Date.now().toString();
    setTexts(prev => [...prev, {
      id: newId,
      text: 'Nuevo texto',
      x: 50,
      y: 50,
      fontSize: 24,
      color: '#ffffff',
      isDragging: false,
    }]);
    setSelectedTextId(newId);
  }, []);

  const removeText = useCallback((id: string) => {
    setTexts(prev => prev.filter(t => t.id !== id));
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }
  }, [selectedTextId]);

  const handleMouseDown = useCallback((e: React.MouseEvent, textId: string) => {
    e.preventDefault();
    setSelectedTextId(textId);
    updateText(textId, { isDragging: true });
  }, [updateText]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!selectedTextId) return;
    
    const text = texts.find(t => t.id === selectedTextId);
    if (!text || !text.isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    updateText(selectedTextId, { 
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    });
  }, [selectedTextId, texts, updateText]);

  const handleMouseUp = useCallback(() => {
    if (selectedTextId) {
      updateText(selectedTextId, { isDragging: false });
    }
  }, [selectedTextId, updateText]);

  const generateMeme = useCallback(async () => {
    if (!canvasRef.current) return;
    
    setIsGenerating(true);
    
    try {
      // Añadir watermark
      const watermark = document.createElement('div');
      watermark.innerText = '📖 InkVerse.app';
      watermark.style.cssText = `
        position: absolute;
        bottom: 5px;
        right: 5px;
        color: rgba(255,255,255,0.8);
        font-size: 12px;
        font-family: sans-serif;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        z-index: 1000;
        pointer-events: none;
      `;
      canvasRef.current.appendChild(watermark);

      const canvas = await html2canvas(canvasRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2,
      });

      canvasRef.current.removeChild(watermark);

      // Descargar
      const link = document.createElement('a');
      link.download = `inkverse-meme-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Guardar en perfil del usuario
      await fetch('/api/memes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          panelId,
          mangaTitle,
          chapterNumber,
          texts: texts.map(t => ({ text: t.text, position: { x: t.x, y: t.y } })),
        }),
      });

    } catch (error) {
      console.error('Error generating meme:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [canvasRef, panelId, mangaTitle, chapterNumber, texts]);

  const shareMeme = useCallback(async () => {
    if (!canvasRef.current) return;
    
    try {
      const canvas = await html2canvas(canvasRef.current, { scale: 2 });
      const blob = await new Promise<Blob>((resolve) => 
        canvas.toBlob((b) => resolve(b!), 'image/png')
      );
      
      const file = new File([blob], 'inkverse-meme.png', { type: 'image/png' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Meme de InkVerse',
          text: `¡Mira este meme de ${mangaTitle} Cap. ${chapterNumber}!`,
          files: [file],
        });
      } else {
        // Fallback: copiar al portapapeles
        const url = canvas.toDataURL('image/png');
        await navigator.clipboard.writeText(url);
        alert('¡Enlace copiado al portapapeles!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [canvasRef, mangaTitle, chapterNumber]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Generador de Memes
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--border)] rounded-full cursor-pointer" aria-label="Cerrar">
            <X className="w-5 h-5 text-[var(--text-inverse)]" />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 p-4 flex items-center justify-center bg-[var(--surface)] overflow-auto">
            <div 
              ref={containerRef}
              className="relative cursor-crosshair select-none"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div 
                ref={canvasRef}
                className="relative inline-block"
                style={{ maxWidth: '100%', maxHeight: '60vh' }}
              >
                <img 
                  src={imageUrl} 
                  alt="Panel para meme"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                  crossOrigin="anonymous"
                />
                
                {/* Text Overlays */}
                {texts.map((text) => (
                  <div
                    key={text.id}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move ${
                      selectedTextId === text.id ? 'ring-2 ring-accent-blue' : ''
                    }`}
                    style={{
                      left: `${text.x}%`,
                      top: `${text.y}%`,
                      fontSize: `${text.fontSize}px`,
                      color: text.color,
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8), -2px -2px 4px rgba(0,0,0,0.8)',
                      fontWeight: 'bold',
                      fontFamily: 'Impact, sans-serif',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                      zIndex: selectedTextId === text.id ? 10 : 1,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, text.id)}
                    onClick={() => setSelectedTextId(text.id)}
                  >
                    {text.text.toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="w-full md:w-80 bg-[var(--surface-sunken)] border-l border-[var(--border)] p-4 overflow-y-auto">
            {/* Text Controls */}
            <div className="space-y-4 mb-6">
<h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
        <Type className="w-4 h-4" />
                Textos
              </h3>
              
              {texts.map((text) => (
                <div 
                  key={text.id}
                  className={`p-3 rounded-lg border ${
                    selectedTextId === text.id 
                      ? 'border-accent-blue bg-accent-blue/10' 
                      : 'border-[var(--border)] bg-[var(--surface-sunken)]'
                  }`}
                  onClick={() => setSelectedTextId(text.id)}
                >
                  <input
                    type="text"
                    value={text.text}
                    onChange={(e) => updateText(text.id, { text: e.target.value })}
                    className="w-full bg-transparent text-[var(--text-primary)] mb-2 focus:outline-none"
                    placeholder="Texto del meme..."
                  />
                  
                  {selectedTextId === text.id && (
                    <div className="space-y-2 mt-2 pt-2 border-t border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-[var(--text-secondary)]">Tamaño:</label>
                        <input
                          type="range"
                          min="16"
                          max="72"
                          value={text.fontSize}
                          onChange={(e) => updateText(text.id, { fontSize: parseInt(e.target.value) })}
                          className="flex-1"
                        />
                        <span className="text-xs text-[var(--text-primary)] w-8">{text.fontSize}px</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-[var(--text-secondary)]">Color:</label>
                        <input
                          type="color"
                          value={text.color}
                          onChange={(e) => updateText(text.id, { color: e.target.value })}
                          className="w-8 h-8 rounded cursor-pointer"
                        />
                      </div>
                      
                      <button
                        onClick={() => removeText(text.id)}
                        className="text-xs text-[var(--error)] hover:text-[var(--error)] mt-2"
                      >
                        Eliminar texto
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              <Button onClick={addText} variant="outline" className="w-full">
                <Type className="w-4 h-4 mr-2" />
                Añadir texto
              </Button>
            </div>

            {/* Quick Templates */}
            <div className="mb-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Plantillas rápidas</h3>
              <div className="grid grid-cols-2 gap-2">
                {MEME_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setTexts([
                        { ...texts[0], text: template.top || 'Texto superior' },
                        { ...texts[1], text: template.bottom || 'Texto inferior' },
                      ]);
                    }}
                    className="p-2 bg-[var(--surface-sunken)] rounded hover:bg-[var(--border)] text-xs text-[var(--text-inverse)] text-left"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button 
                onClick={generateMeme} 
                className="w-full"
                isLoading={isGenerating}
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar Meme
              </Button>
              
              <Button 
                onClick={shareMeme} 
                variant="outline" 
                className="w-full"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </Button>
            </div>

            {/* Tips */}
            <div className="mt-6 p-3 bg-[var(--surface-sunken)]/50 rounded-lg text-xs text-[var(--text-secondary)]">
              <p className="font-semibold text-[var(--text-primary)] mb-1">💡 Tips:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Arrastra los textos para posicionarlos</li>
                <li>Usa texto en MAYÚSCULAS para impacto</li>
                <li>Menos es más - manténlo simple</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
