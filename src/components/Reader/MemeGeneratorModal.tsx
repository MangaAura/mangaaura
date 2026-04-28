'use client';

import React, { useState, useRef } from 'react';
import { X, Download, Type } from 'lucide-react';

interface MemeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

export default function MemeGeneratorModal({ isOpen, onClose, imageUrl }: MemeGeneratorModalProps) {
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!isOpen) return null;

  const handleDownload = () => {
    // Basic download simulation for the prototype
    alert("¡Meme descargado con éxito! (Simulación)");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-secondary w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-custom">
        <div className="flex justify-between items-center p-4 border-b border-custom">
          <h2 className="text-lg font-bold flex items-center gap-2"><Type size={20} /> Generador de Memes</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-tertiary transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-6">
          {/* Canvas Simulation */}
          <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden flex items-center justify-center">
            <img src={imageUrl} alt="Meme template" className="absolute inset-0 w-full h-full object-cover opacity-60" />
            
            <div className="absolute inset-0 flex flex-col justify-between py-4 px-2 text-center">
              <h3 className="text-white text-3xl font-black uppercase" style={{ WebkitTextStroke: '1px black', textShadow: '2px 2px 0 #000' }}>
                {topText || "TEXTO SUPERIOR"}
              </h3>
              <h3 className="text-white text-3xl font-black uppercase" style={{ WebkitTextStroke: '1px black', textShadow: '2px 2px 0 #000' }}>
                {bottomText || "TEXTO INFERIOR"}
              </h3>
            </div>
            
            <div className="absolute bottom-2 right-2 text-white/50 text-xs font-bold font-mono">
              INKVERSE
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Texto Superior</label>
              <input 
                type="text" 
                value={topText}
                onChange={(e) => setTopText(e.target.value)}
                placeholder="Escribe algo gracioso..." 
                className="w-full bg-tertiary border border-custom rounded-lg px-4 py-2 focus:outline-none focus:border-accent-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Texto Inferior</label>
              <input 
                type="text" 
                value={bottomText}
                onChange={(e) => setBottomText(e.target.value)}
                placeholder="Remate del chiste..." 
                className="w-full bg-tertiary border border-custom rounded-lg px-4 py-2 focus:outline-none focus:border-accent-blue"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-custom bg-tertiary flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold hover:bg-secondary rounded-lg transition-colors border border-custom">
            Cancelar
          </button>
          <button onClick={handleDownload} className="px-4 py-2 text-sm font-semibold bg-accent-blue hover:bg-accent-blue-hover text-white rounded-lg flex items-center gap-2 transition-colors">
            <Download size={16} /> Descargar Meme
          </button>
        </div>
      </div>
    </div>
  );
}
