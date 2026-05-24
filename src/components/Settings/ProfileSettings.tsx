'use client';

import { Upload, X, Check, User, Crop as CropIcon, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { ImageCropperUploader, type ImageCropperUploaderHandle } from '@/components/ui/ImageCropperUploader';

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
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl);
  const [avatarError, setAvatarError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const cropperRef = useRef<ImageCropperUploaderHandle>(null);

  // Username availability check
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const usernameCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (usernameCheckTimerRef.current) clearTimeout(usernameCheckTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handleUsernameChange = (value: string) => {
    setFormData((prev) => ({ ...prev, username: value }));
    setIsDirty(true);

    if (usernameCheckTimerRef.current) clearTimeout(usernameCheckTimerRef.current);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (!value || value.length < 3) {
      setUsernameAvailable(null);
      setUsernameChecking(false);
      return;
    }

    usernameCheckTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setUsernameChecking(true);
      try {
        const res = await fetch(
          `/api/auth/check-username?username=${encodeURIComponent(value)}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          if (!controller.signal.aborted) {
            setUsernameAvailable(data.available || value.toLowerCase() === user.username.toLowerCase());
          }
        }
      } catch {
        if (abortControllerRef.current === controller) {
          setUsernameAvailable(null);
          setUsernameChecking(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setUsernameChecking(false);
        }
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    }, 500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleAvatarClick = () => {
    cropperRef.current?.open();
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    setUploadingAvatar(true);

    // Show local preview immediately
    const previewUrl = URL.createObjectURL(croppedBlob);
    setAvatarPreview(previewUrl);
    setIsDirty(true);

    try {
      const formData = new FormData();
      formData.append('file', croppedBlob, 'avatar.webp');

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url } = await response.json();
      // Revoke the local preview and set the real URL
      URL.revokeObjectURL(previewUrl);
      setAvatarPreview(url);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setAvatarError('Error al subir la imagen recortada');
      // Revert preview to original avatar
      setAvatarPreview(user.avatarUrl);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSaveError(null);

    try {
      const response = await fetch('/api/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formData.displayName,
          username: formData.username !== user.username ? formData.username : undefined,
          avatarUrl: avatarPreview,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar el perfil');
      }

      setIsDirty(false);
      setSaveStatus('success');
      setFormData((prev) => ({ ...prev, username: data.user.username }));
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'Error al actualizar el perfil');
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
            <p className="text-sm text-[var(--error)]">{saveError || 'Error al actualizar perfil. Inténtalo de nuevo.'}</p>
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
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center hover:bg-[var(--primary-hover)] transition-colors cursor-pointer disabled:opacity-50"
              aria-label="Subir avatar"
            >
              {uploadingAvatar ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4 text-[var(--text-inverse)]" />
              )}
            </button>
            <ImageCropperUploader
              ref={cropperRef}
              aspect={1}
              cropperTitle="Ajustar foto de perfil"
              cropperSubtitle="Arrastra para encuadrar · Ratio 1:1 (cuadrado)"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onCropComplete={handleCropConfirm}
              onError={setAvatarError}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[var(--text-primary)]">Foto de perfil</h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              JPEG, PNG, WebP o GIF. Recorte cuadrado 1:1 antes de subir.
            </p>
            {avatarPreview && avatarPreview !== user.avatarUrl && !uploadingAvatar && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[var(--text-tertiary)]">
                <CropIcon className="w-3 h-3" />
                <span>Imagen recortada al cuadrado</span>
              </div>
            )}
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
                onChange={(e) => handleUsernameChange(e.target.value)}
                className="pl-8"
                maxLength={30}
                minLength={3}
                pattern="^[a-zA-Z0-9_]+$"
                aria-describedby="username-status"
              />
              {usernameChecking && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--text-tertiary)]" />
                </span>
              )}
              {!usernameChecking && usernameAvailable === true && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--success)]">
                  <Check className="w-4 h-4" />
                </span>
              )}
              {!usernameChecking && usernameAvailable === false && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--error)]">
                  <X className="w-4 h-4" />
                </span>
              )}
            </div>
            <p id="username-status" className="text-xs text-[var(--text-tertiary)]">
              {usernameChecking
                ? 'Verificando disponibilidad...'
                : usernameAvailable === false
                  ? 'Este nombre de usuario ya está en uso'
                  : 'Mín. 3 caracteres. Solo letras, números y guión bajo.'}
            </p>
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
              });
              setAvatarPreview(user.avatarUrl);
              setAvatarError('');
              setSaveStatus('idle');
              setSaveError(null);
              setIsDirty(false);
              setUsernameAvailable(null);
              setUsernameChecking(false);
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
