'use client';

import React, { useState } from 'react';
import { PanelTextOverlay, type PanelText } from '@/components/Reader/PanelTextOverlay';
import { usePanelTexts } from '@/hooks/usePanelTexts';
import { Button } from '@/components/ui/Button';
import { Pencil, Eye, Download, Upload, Trash2 } from 'lucide-react';
import html2canvas from 'html2canvas';

// Demo image - you can replace with your own manga panel
const DEMO_IMAGE = 'https://placehold.co/800x600/1a1a2e/ffffff?text=Panel+de+Manga';

export default function PanelTextsDemoPage() {
  const [isEditing, setIsEditing] = useState(true);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);

  const {
    texts,
    setTexts,
    isDirty,
    clearTexts,
    exportAsJSON,
    importFromJSON,
  } = usePanelTexts({
    initialTexts: [
      {
        id: 'demo-1',
        text: '¡Hola!\nSoy un diálogo',
        x: 30,
        y: 25,
        fontSize: 16,
        color: '#1a1a1a',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 50,
        padding: 16,
        rotation: 0,
        type: 'speech',
      },
      {
        id: 'demo-2',
        text: 'Pensando en...',
        x: 70,
        y: 40,
        fontSize: 15,
        color: '#4a4a4a',
        backgroundColor: 'rgba(240,240,240,0.95)',
        borderRadius: 30,
        padding: 14,
        rotation: 0,
        type: 'thought',
      },
    ],
  });

  const handleExportImage = async () => {
    if (!overlayRef.current) return;
    
    try {
      const canvas = await html2canvas(overlayRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2,
      });
      
      const url = canvas.toDataURL('image/png');
      setExportUrl(url);
      
      // Auto download
      const link = document.createElement('a');
      link.download = `inkverse-panel-${Date.now()}.png`;
      link.href = url;
      link.click();
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error al exportar la imagen');
    }
  };

  const handleExportJSON = () => {
    const json = exportAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `panel-texts-${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      importFromJSON(json);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🎨 Editor de Viñetas
          </h1>
          <p className="text-slate-400">
            Demostración del componente PanelTextOverlay. Añade, edita y posiciona viñetas de texto sobre paneles de manga.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-6 p-4 bg-slate-800 rounded-xl">
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            {isEditing ? <Eye className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
            {isEditing ? 'Vista previa' : 'Editar'}
          </Button>

          <Button
            onClick={handleExportImage}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar imagen
          </Button>

          <Button
            onClick={handleExportJSON}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Exportar JSON
          </Button>

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
              <Upload className="w-4 h-4" />
              Importar JSON
            </span>
          </label>

          {isDirty && (
            <span className="flex items-center text-amber-400 text-sm">
              • Cambios sin guardar
            </span>
          )}

          {texts.length > 0 && (
            <Button
              onClick={clearTexts}
              variant="outline"
              className="flex items-center gap-2 text-red-400 hover:text-red-300 ml-auto"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar todo
            </Button>
          )}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-xl p-4">
              <div ref={overlayRef} className="inline-block">
                <PanelTextOverlay
                  imageUrl={DEMO_IMAGE}
                  texts={texts}
                  onTextsChange={setTexts}
                  isEditing={isEditing}
                  readOnly={false}
                />
              </div>
            </div>
          </div>

          {/* Sidebar info */}
          <div className="space-y-4">
            {/* Instructions */}
            <div className="bg-slate-800 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-3">📖 Instrucciones</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-accent-blue">1.</span>
                  <span>Haz clic en "Editar" para activar el modo edición</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-blue">2.</span>
                  <span>Usa el menú izquierdo para añadir viñetas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-blue">3.</span>
                  <span>Arrastra las viñetas para moverlas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-blue">4.</span>
                  <span>Haz clic en una viñeta para editar su texto</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-blue">5.</span>
                  <span>Usa el panel derecho para personalizar estilos</span>
                </li>
              </ul>
            </div>

            {/* Stats */}
            <div className="bg-slate-800 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-3">📊 Estadísticas</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total viñetas:</span>
                  <span className="text-white font-medium">{texts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Diálogos:</span>
                  <span className="text-white font-medium">
                    {texts.filter(t => t.type === 'speech').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pensamientos:</span>
                  <span className="text-white font-medium">
                    {texts.filter(t => t.type === 'thought').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Narración:</span>
                  <span className="text-white font-medium">
                    {texts.filter(t => t.type === 'narration').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sonidos:</span>
                  <span className="text-white font-medium">
                    {texts.filter(t => t.type === 'sound').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Types info */}
            <div className="bg-slate-800 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-3">🎭 Tipos de viñetas</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex-shrink-0"></div>
                  <div>
                    <p className="text-white font-medium">Diálogo</p>
                    <p className="text-slate-500 text-xs">Burbuja redonda con cola</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-400 border-dashed flex-shrink-0"></div>
                  <div>
                    <p className="text-white font-medium">Pensamiento</p>
                    <p className="text-slate-500 text-xs">Nube con bordes suaves</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black border border-slate-600 flex-shrink-0"></div>
                  <div>
                    <p className="text-white font-medium">Narración</p>
                    <p className="text-slate-500 text-xs">Caja con fondo oscuro</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-red-400 font-black text-lg">!</div>
                  <div>
                    <p className="text-white font-medium">Efecto de sonido</p>
                    <p className="text-slate-500 text-xs">Texto rotado, sin fondo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Export preview */}
            {exportUrl && (
              <div className="bg-slate-800 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-3">👁️ Vista previa</h3>
                <img 
                  src={exportUrl} 
                  alt="Export preview" 
                  className="w-full rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
