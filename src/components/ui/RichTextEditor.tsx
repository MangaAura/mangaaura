'use client';

import Color from '@tiptap/extension-color';
import HighlightExtension from '@tiptap/extension-highlight';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import PlaceholderExtension from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import TableCellExtension from '@tiptap/extension-table-cell';
import TableHeaderExtension from '@tiptap/extension-table-header';
import TableRowExtension from '@tiptap/extension-table-row';
import TextAlignExtension from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import UnderlineExtension from '@tiptap/extension-underline';
import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link,
  Image,
  Table2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Pilcrow,
  Quote,
  Code,
  Combine,
  Split,
  Trash2,
  Palette,
  SeparatorHorizontal,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ChevronDown,
  Upload,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Undo2,
  Redo2,
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  disabled?: boolean;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
        'hover:bg-[var(--surface-sunken)]',
        active
          ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
          : 'text-[var(--text-secondary)]',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div className="w-px h-5 bg-[var(--border)] mx-0.5 shrink-0" />
  );
}

const isValidUrl = (value: string): boolean => {
  if (!value) return true; // empty is allowed (removes link)
  return /^https?:\/\/.+/i.test(value);
};

function LinkInput({ editor }: { editor: Editor }) {
  const [show, setShow] = useState(false);
  const [url, setUrl] = useState('');
  const [urlTouched, setUrlTouched] = useState(false);

  const urlError = urlTouched && url !== '' && !isValidUrl(url) ? 'URL no válida' : null;
  const urlValid = urlTouched && url !== '' && isValidUrl(url);

  const handleSetLink = () => {
    if (!url || !isValidUrl(url)) {
      if (url && !isValidUrl(url)) return;
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setShow(false);
    setUrl('');
    setUrlTouched(false);
  };

  const handleOpen = () => {
    const previousUrl = editor.getAttributes('link').href || '';
    setUrl(previousUrl);
    setShow(true);
  };

  return (
    <div className="relative">
      <ToolbarButton
        onClick={handleOpen}
        active={editor.isActive('link')}
        title="Insertar enlace"
      >
        <Link className="w-4 h-4" />
      </ToolbarButton>
      {show && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg shadow-lg min-w-[300px]">
          <div className="flex items-center gap-2 p-2">
            <div className="flex-1 relative">
              <input
                type="url"
                name="link-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={() => setUrlTouched(true)}
                placeholder="https://..."
                className={cn(
                  'w-full px-2 py-1.5 pr-8 text-sm bg-[var(--surface-sunken)] border rounded-md text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]',
                  urlError ? 'border-[var(--error)] focus:ring-[var(--error)]' : urlValid ? 'border-[var(--success)]' : 'border-[var(--border)]'
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSetLink();
                  if (e.key === 'Escape') setShow(false);
                }}
                autoFocus
              />
              {urlTouched && url !== '' && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2">
                  {urlError ? (
                    <XCircle className="w-3.5 h-3.5 text-[var(--error)]" />
                  ) : urlValid ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                  ) : null}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleSetLink}
              disabled={!!urlError}
              className="px-3 py-1.5 text-xs font-medium bg-[var(--primary)] text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {url ? 'Aplicar' : 'Eliminar'}
            </button>
          </div>
          {urlError && (
            <div className="px-3 pb-2 flex items-start gap-1.5 text-xs text-[var(--error)]" role="alert">
              <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>La URL debe comenzar con http:// o https://</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HighlightInput({ editor }: { editor: Editor }) {
  const [show, setShow] = useState(false);

  const COLORS = [
    { label: 'Amarillo', value: '#fef08a' },
    { label: 'Verde', value: '#bbf7d0' },
    { label: 'Azul', value: '#bfdbfe' },
    { label: 'Rosa', value: '#fbcfe8' },
    { label: 'Rojo', value: '#fecaca' },
    { label: 'Púrpura', value: '#e9d5ff' },
    { label: 'Naranja', value: '#fed7aa' },
  ];

  const currentColor = editor.getAttributes('highlight').color || null;

  return (
    <div className="relative">
      <ToolbarButton
        onClick={() => setShow(!show)}
        active={editor.isActive('highlight')}
        title="Resaltar texto"
      >
        <Highlighter className="w-4 h-4" />
      </ToolbarButton>
      {show && (
        <div className="absolute top-full left-0 mt-1 z-50 p-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg shadow-lg min-w-[180px]">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => {
                  editor.chain().focus().setHighlight({ color: color.value }).run();
                  setShow(false);
                }}
                title={color.label}
                className={cn(
                  'w-7 h-7 rounded-md border-2 transition-all',
                  currentColor === color.value
                    ? 'border-[var(--primary)] scale-110'
                    : 'border-transparent hover:scale-110'
                )}
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().unsetHighlight().run();
              setShow(false);
            }}
            className="w-full px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] rounded transition-colors"
          >
            Eliminar resaltado
          </button>
        </div>
      )}
    </div>
  );
}

function ImageInput({ editor }: { editor: Editor }) {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [url, setUrl] = useState('');
  const [urlTouched, setUrlTouched] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

  const handleSetImageUrl = () => {
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
    closePopover();
  };

  const closePopover = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setShow(false);
    setMode('url');
    setUrl('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Formato no soportado. Usa JPEG, PNG, WebP, GIF o AVIF.');
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`Archivo demasiado grande. Máximo: 10MB (${(file.size / 1024 / 1024).toFixed(1)}MB seleccionado).`);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Error al subir la imagen' }));
        throw new Error(err.error || `Error ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
        closePopover();
      } else {
        throw new Error(data.error || 'Respuesta inválida del servidor');
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error desconocido al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Trigger validation via the file input change handler
      const input = fileInputRef.current;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        handleFileSelect({ target: { files: dt.files } } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearSelectedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="relative">
      <ToolbarButton
        onClick={() => setShow(true)}
        title="Insertar imagen"
      >
        <Image className="w-4 h-4" />
      </ToolbarButton>
      {show && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg shadow-lg min-w-[340px] overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[var(--border)]">
            <button
              type="button"
              onClick={() => { setMode('url'); setUploadError(null); }}
              className={cn(
                'flex-1 px-3 py-2 text-xs font-medium transition-colors',
                mode === 'url'
                  ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              )}
            >
              URL
            </button>
            <button
              type="button"
              onClick={() => { setMode('upload'); setUploadError(null); }}
              className={cn(
                'flex-1 px-3 py-2 text-xs font-medium transition-colors',
                mode === 'upload'
                  ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              )}
            >
              <Upload className="w-3 h-3 inline mr-1" />
              Subir
            </button>
          </div>

          <div className="p-3">
            {mode === 'url' ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="url"
                      name="image-url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onBlur={() => setUrlTouched(true)}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className={cn(
                        'w-full px-2 py-1.5 pr-8 text-sm bg-[var(--surface-sunken)] border rounded-md text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]',
                        urlTouched && url !== '' && !isValidUrl(url) ? 'border-[var(--error)] focus:ring-[var(--error)]' : urlTouched && url !== '' && isValidUrl(url) ? 'border-[var(--success)]' : 'border-[var(--border)]'
                      )}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSetImageUrl();
                        if (e.key === 'Escape') closePopover();
                      }}
                      autoFocus
                    />
                    {urlTouched && url !== '' && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2">
                        {!isValidUrl(url) ? (
                          <XCircle className="w-3.5 h-3.5 text-[var(--error)]" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                        )}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSetImageUrl}
                    disabled={!!(url && !isValidUrl(url))}
                    className="px-3 py-1.5 text-xs font-medium bg-[var(--primary)] text-white rounded-md hover:opacity-90 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Insertar
                  </button>
                </div>
                {urlTouched && url !== '' && !isValidUrl(url) && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-xs text-[var(--error)]" role="alert">
                    <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>La URL debe comenzar con http:// o https://</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Drop zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                    previewUrl
                      ? 'border-[var(--primary)]/40 bg-[var(--primary)]/5'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/40 hover:bg-[var(--surface-sunken)]',
                    uploading && 'pointer-events-none opacity-60'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="image-file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {previewUrl ? (
                    <div className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-32 rounded object-contain mx-auto"
                      />
                      {!uploading && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); clearSelectedFile(); }}
                          className="absolute -top-2 -right-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-full p-0.5 hover:bg-[var(--surface-sunken)] transition-colors shadow-sm"
                          title="Quitar archivo"
                        >
                          <X className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                        </button>
                      )}
                      {selectedFile && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-1.5">
                          {(selectedFile.size / 1024).toFixed(0)} KB
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <Upload className="w-6 h-6 text-[var(--text-tertiary)]" />
                      <p className="text-xs text-[var(--text-secondary)] font-medium">
                        Haz clic o arrastra una imagen aquí
                      </p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">
                        JPEG, PNG, WebP, GIF o AVIF · Max 10MB
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload error */}
                {uploadError && (
                  <p className="mt-2 text-xs text-red-500">{uploadError}</p>
                )}

                {/* Upload button */}
                {selectedFile && !uploading && (
                  <button
                    type="button"
                    onClick={handleUpload}
                    className="mt-3 w-full px-3 py-2 text-xs font-medium bg-[var(--primary)] text-white rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Subir imagen optimizada
                  </button>
                )}

                {/* Uploading state */}
                {uploading && (
                  <div className="mt-3 flex items-center justify-center gap-2 py-2 text-xs text-[var(--text-secondary)]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Subiendo y optimizando...
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ColorInput({ editor }: { editor: Editor }) {
  const [show, setShow] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [show]);

  const COLORS = [
    { label: 'Negro', value: '#000000' },
    { label: 'Gris oscuro', value: '#4a4a4a' },
    { label: 'Gris', value: '#808080' },
    { label: 'Rojo', value: '#dc2626' },
    { label: 'Naranja', value: '#ea580c' },
    { label: 'Ámbar', value: '#d97706' },
    { label: 'Amarillo', value: '#ca8a04' },
    { label: 'Verde', value: '#16a34a' },
    { label: 'Esmeralda', value: '#059669' },
    { label: 'Cian', value: '#0891b2' },
    { label: 'Azul', value: '#2563eb' },
    { label: 'Índigo', value: '#4f46e5' },
    { label: 'Púrpura', value: '#7c3aed' },
    { label: 'Rosa', value: '#db2777' },
  ];

  const currentColor = editor.getAttributes('textStyle').color || null;

  return (
    <div className="relative" ref={popoverRef}>
      <ToolbarButton
        onClick={() => setShow(!show)}
        active={!!currentColor}
        title="Color de texto"
      >
        <Palette className="w-4 h-4" />
      </ToolbarButton>
      {show && (
        <div className="absolute top-full left-0 mt-1 z-50 p-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg shadow-lg min-w-[220px]">
          <div className="text-xs text-[var(--text-tertiary)] mb-2 font-medium">Color de texto</div>
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => {
                  editor.chain().focus().setColor(color.value).run();
                  setShow(false);
                }}
                title={color.label}
                className={cn(
                  'w-6 h-6 rounded-md border-2 transition-all',
                  currentColor === color.value
                    ? 'border-[var(--primary)] scale-110 ring-1 ring-[var(--primary)]/30'
                    : 'border-transparent hover:scale-110'
                )}
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().unsetColor().run();
              setShow(false);
            }}
            className="w-full px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] rounded transition-colors"
          >
            Restablecer color
          </button>
        </div>
      )}
    </div>
  );
}

function EditorFooter({ editor }: { editor: Editor }) {
  const text = editor.getText();

  const charCount = text.length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 border-t border-[var(--border)] bg-[var(--surface)]/50 text-xs text-[var(--text-tertiary)]">
      <span className="flex items-center gap-1.5">
        <span className="font-medium text-[var(--text-secondary)]">{charCount}</span>
        {charCount === 1 ? 'caracter' : 'caracteres'}
      </span>
      <span className="w-px h-3 bg-[var(--border)]" />
      <span className="flex items-center gap-1.5">
        <span className="font-medium text-[var(--text-secondary)]">{wordCount}</span>
        {wordCount === 1 ? 'palabra' : 'palabras'}
      </span>
      {wordCount > 0 && (
        <>
          <span className="w-px h-3 bg-[var(--border)]" />
          <span className="flex items-center gap-1.5">
            ~{readingTime} {readingTime === 1 ? 'minuto' : 'minutos'} de lectura
          </span>
        </>
      )}
    </div>
  );
}

function TableInput({ editor }: { editor: Editor }) {
  const [show, setShow] = useState(false);
  const [hoveredRows, setHoveredRows] = useState(0);
  const [hoveredCols, setHoveredCols] = useState(0);

  const isInTable = editor.isActive('table');

  const insertTable = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setShow(false);
  };

  const cellClass = (row: number, col: number) => {
    if (row < hoveredRows && col < hoveredCols) {
      return 'bg-[var(--primary)]/30 border-[var(--primary)]';
    }
    return 'bg-[var(--surface-sunken)] border-[var(--border)]';
  };

  return (
    <div className="relative">
      <ToolbarButton
        onClick={() => setShow(!show)}
        active={isInTable}
        title="Insertar tabla"
      >
        <div className="flex items-center gap-0.5">
          <Table2 className="w-4 h-4" />
          <ChevronDown className="w-2.5 h-2.5" />
        </div>
      </ToolbarButton>
      {show && (
        <div className="absolute top-full left-0 mt-1 z-50 p-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg shadow-lg min-w-[260px]">
          {!isInTable ? (
            <>
              <div className="text-xs text-[var(--text-tertiary)] mb-2 font-medium">Insertar tabla</div>
              <div
                className="grid gap-0.5 mb-2"
                style={{ gridTemplateColumns: 'repeat(7, 20px)' }}
                onMouseLeave={() => { setHoveredRows(0); setHoveredCols(0); }}
              >
                {Array.from({ length: 49 }, (_, i) => {
                  const row = Math.floor(i / 7) + 1;
                  const col = (i % 7) + 1;
                  return (
                    <div
                      key={i}
                      className={cn(
                        'w-5 h-5 rounded-sm border cursor-pointer transition-colors',
                        cellClass(row, col)
                      )}
                      onMouseEnter={() => { setHoveredRows(row); setHoveredCols(col); }}
                      onClick={() => insertTable(row, col)}
                    />
                  );
                })}
              </div>
              {hoveredRows > 0 && hoveredCols > 0 && (
                <div className="text-xs text-[var(--text-secondary)] text-center">
                  {hoveredRows} × {hoveredCols}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-xs text-[var(--text-tertiary)] mb-2 font-medium">Editar tabla</div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs rounded hover:bg-[var(--surface-sunken)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  title="Fila arriba"
                >
                  <ArrowUpToLine className="w-3.5 h-3.5" />
                  Fila ↑
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs rounded hover:bg-[var(--surface-sunken)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  title="Fila abajo"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  Fila ↓
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnBefore().run()}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs rounded hover:bg-[var(--surface-sunken)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  title="Columna izquierda"
                >
                  <ArrowLeftToLine className="w-3.5 h-3.5" />
                  Col ←
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs rounded hover:bg-[var(--surface-sunken)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  title="Columna derecha"
                >
                  <ArrowRightToLine className="w-3.5 h-3.5" />
                  Col →
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().mergeCells().run()}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs rounded hover:bg-[var(--surface-sunken)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  title="Combinar celdas"
                >
                  <Combine className="w-3.5 h-3.5" />
                  Unir
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().splitCell().run()}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs rounded hover:bg-[var(--surface-sunken)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  title="Dividir celda"
                >
                  <Split className="w-3.5 h-3.5" />
                  Div.
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs rounded transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  title="Eliminar tabla"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Elim.
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escribe aquí...',
  minHeight = 200,
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      UnderlineExtension,
      TextAlignExtension.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      HighlightExtension.configure({
        multicolor: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRowExtension,
      TableCellExtension,
      TableHeaderExtension,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[var(--primary)] underline underline-offset-2 hover:opacity-80',
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-2',
        },
      }),
      PlaceholderExtension.configure({
        placeholder,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none px-4 py-3',
          'text-[var(--text-primary)] min-h-[200px]',
          disabled && 'cursor-not-allowed opacity-50'
        ),
        style: `min-height: ${minHeight}px`,
      },
    },
    editable: !disabled,
  });

  // Sync external value changes via microtask to avoid hook ordering issues
  if (editor && value !== editor.getHTML() && !editor.isDestroyed) {
    queueMicrotask(() => {
      if (!editor.isDestroyed) {
        editor.commands.setContent(value || '', { emitUpdate: false });
      }
    });
  }

  if (!editor) {
    return (
      <div
        className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg animate-pulse"
        style={{ minHeight }}
      />
    );
  }

  return (
    <div
      className={cn(
        'bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg overflow-hidden',
        'focus-within:ring-2 focus-within:ring-[var(--primary)] focus-within:border-transparent',
        disabled && 'opacity-60'
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-[var(--border)] bg-[var(--surface)]">
        {/* Undo / Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Deshacer (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Rehacer (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Negrita (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Cursiva (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Subrayado (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Tachado (Ctrl+Shift+X)"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Título H2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Subtítulo H3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive('paragraph')}
          title="Párrafo"
        >
          <Pilcrow className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Lists & blocks */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Lista con viñetas"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Lista numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Cita"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Bloque de código"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Línea horizontal"
        >
          <SeparatorHorizontal className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Highlight & Color */}
        <HighlightInput editor={editor} />
        <ColorInput editor={editor} />

        <Divider />

        {/* Text alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Alinear izquierda"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Centrar"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Alinear derecha"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Media & inserts */}
        <LinkInput editor={editor} />
        <ImageInput editor={editor} />
        <TableInput editor={editor} />
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Footer stats */}
      <EditorFooter editor={editor} />
    </div>
  );
}
