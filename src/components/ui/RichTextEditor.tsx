'use client';

import type { Editor } from '@tiptap/react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import PlaceholderExtension from '@tiptap/extension-placeholder';
import UnderlineExtension from '@tiptap/extension-underline';
import TextAlignExtension from '@tiptap/extension-text-align';
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Pilcrow,
  Quote,
  Code,
} from 'lucide-react';
import { useCallback, useState } from 'react';

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

function LinkInput({ editor }: { editor: Editor }) {
  const [show, setShow] = useState(false);
  const [url, setUrl] = useState('');

  const handleSetLink = () => {
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setShow(false);
    setUrl('');
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
        <div className="absolute top-full left-0 mt-1 z-50 flex items-center gap-2 p-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg shadow-lg min-w-[300px]">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 px-2 py-1.5 text-sm bg-[var(--surface-sunken)] border border-[var(--border)] rounded-md text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSetLink();
              if (e.key === 'Escape') setShow(false);
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={handleSetLink}
            className="px-3 py-1.5 text-xs font-medium bg-[var(--primary)] text-white rounded-md hover:opacity-90"
          >
            {url ? 'Aplicar' : 'Eliminar'}
          </button>
        </div>
      )}
    </div>
  );
}

function ImageInput({ editor }: { editor: Editor }) {
  const [show, setShow] = useState(false);
  const [url, setUrl] = useState('');

  const handleSetImage = () => {
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
    setShow(false);
    setUrl('');
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
        <div className="absolute top-full left-0 mt-1 z-50 flex items-center gap-2 p-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg shadow-lg min-w-[300px]">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="flex-1 px-2 py-1.5 text-sm bg-[var(--surface-sunken)] border border-[var(--border)] rounded-md text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSetImage();
              if (e.key === 'Escape') setShow(false);
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={handleSetImage}
            className="px-3 py-1.5 text-xs font-medium bg-[var(--primary)] text-white rounded-md hover:opacity-90"
          >
            Insertar
          </button>
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

  // Update content when value prop changes externally
  // (e.g., when loading article for edit)
  const prevValueRef = useCallback(
    (val: string) => {
      if (editor && val !== editor.getHTML()) {
        editor.commands.setContent(val || '', false);
      }
    },
    [editor]
  );

  // We need to synchronize external value changes
  // This is a workaround using a useEffect-like pattern inside the render
  // Since we can't use hooks conditionally, we use the editor's built-in commands
  if (editor && value !== editor.getHTML() && !editor.isDestroyed) {
    // This will run on re-render when value changes externally
    queueMicrotask(() => {
      if (!editor.isDestroyed) {
        editor.commands.setContent(value || '', false);
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

        <Divider />

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

        <Divider />

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

        <LinkInput editor={editor} />
        <ImageInput editor={editor} />
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
