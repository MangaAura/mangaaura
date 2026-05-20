'use client';

import { Upload, X, Check, User } from 'lucide-react';
import { useState, useRef } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

interface ProfileSettingsProps {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    username: user.username,
    email: user.email,
    bio: '',
    website: '',
    location: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl);
  const [avatarError, setAvatarError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
      setIsDirty(true);
    };
    reader.readAsDataURL(file);

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url } = await response.json();
      setAvatarPreview(url);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setAvatarError('Error al subir imagen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formData.displayName,
          bio: formData.bio,
          website: formData.website,
          location: formData.location,
          avatarUrl: avatarPreview,
        }),
      });

      if (!response.ok) throw new Error('Update failed');

      setIsDirty(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Información del Perfil</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Actualiza tu información pública visible para otros usuarios
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {saveStatus === 'success' && (
          <div role="status" className="p-3 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/30">
            <p className="text-sm text-[var(--success)]">Perfil actualizado correctamente</p>
          </div>
        )}
        {saveStatus === 'error' && (
          <div role="alert" className="p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/30">
            <p className="text-sm text-[var(--error)]">Error al actualizar perfil. Inténtalo de nuevo.</p>
          </div>
        )}
        {avatarError && (
          <div role="alert" className="p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/30">
            <p className="text-sm text-[var(--error)]">{avatarError}</p>
          </div>
        )}
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="w-24 h-24 cursor-pointer hover:opacity-90 transition-opacity">
              <AvatarImage src={avatarPreview || undefined} />
              <AvatarFallback className="text-2xl bg-[var(--primary)]">
                <User className="w-10 h-10" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
        <button
          type="button"
          onClick={handleAvatarClick}
          className="absolute -bottom-2 -right-2 w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center hover:bg-[var(--primary-hover)] transition-colors cursor-pointer"
          aria-label="Subir avatar"
        >
              <Upload className="w-4 h-4 text-[var(--text-inverse)]" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only"
              id="avatar-upload-input"
            />
          </div>
          <div>
            <h3 className="font-medium text-[var(--text-primary)]">Foto de perfil</h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              JPG, PNG o GIF. Max 2MB.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Nombre visible</Label>
            <Input
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Tu nombre público"
              maxLength={50}
            />
            <p className="text-xs text-[var(--text-tertiary)]">
              {formData.displayName.length}/50 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Nombre de usuario</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true">
                @
              </span>
              <Input
                id="username"
                name="username"
                value={formData.username}
                disabled
                className="pl-8 bg-[var(--surface-sunken)]"
              />
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              Tu nombre de usuario no puede cambiarse
            </p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-[var(--surface-sunken)]"
            />
            <p className="text-xs text-[var(--text-tertiary)]">
              Para cambiar tu email, ve a Configuración de Seguridad
            </p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bio">Biografía</Label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Cuéntanos sobre ti..."
              maxLength={500}
              rows={4}
              aria-describedby="bio-charcount"
              className="w-full px-3 py-2 rounded-md bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <p id="bio-charcount" className="text-xs text-[var(--text-tertiary)] text-right">
              {formData.bio.length}/500 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Sitio web</Label>
            <Input
              id="website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Ubicación</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Ciudad, País"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-[var(--border)]">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                displayName: user.displayName || '',
                username: user.username,
                email: user.email,
                bio: '',
                website: '',
                location: '',
              });
              setAvatarPreview(user.avatarUrl);
              setAvatarError('');
              setSaveStatus('idle');
              setIsDirty(false);
            }}
            disabled={!isDirty || isLoading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!isDirty || isLoading}
            isLoading={isLoading}
          >
            <Check className="w-4 h-4 mr-2" />
            Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
