'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Loader2,
  Upload,
  X,
  Globe,
  Hash,
  Camera,
  Video,
  MessageCircle,
  Image,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRef, useState, useEffect } from 'react';


import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { extractApiError } from '@/lib/extract-api-error';

interface ProfileSettingsProps {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    email: string;
    avatarUrl: string | null;
    coverUrl?: string | null;
    bio?: string | null;
    website?: string | null;
    socialLinks?: string | null;
  };
}

const SOCIAL_PLATFORMS = [
  { id: 'twitter', label: 'Twitter / X', icon: MessageCircle, placeholder: 'https://x.com/usuario' },
  { id: 'instagram', label: 'Instagram', icon: Camera, placeholder: 'https://instagram.com/usuario' },
  { id: 'youtube', label: 'YouTube', icon: Video, placeholder: 'https://youtube.com/@usuario' },
  { id: 'tiktok', label: 'TikTok', icon: Hash, placeholder: 'https://tiktok.com/@usuario' },
  { id: 'discord', label: 'Discord', icon: MessageCircle, placeholder: 'https://discord.gg/invite' },
];

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const { update: updateSession } = useSession();

  const parseSocialLinks = (): Record<string, string> => {
    try {
      if (user.socialLinks) return JSON.parse(user.socialLinks);
    } catch {}
    return {};
  };

  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    username: user.username,
    email: user.email,
    bio: user.bio || '',
    website: user.website || '',
  });
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(parseSocialLinks());
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl);
  const [avatarError, setAvatarError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [coverPreview, setCoverPreview] = useState<string | null>(user.coverUrl || null);
  const [coverError, setCoverError] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

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
    setFieldErrors((prev) => ({ ...prev, username: '' }));

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
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSocialChange = (platform: string, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [platform]: value }));
    setIsDirty(true);
    setFieldErrors((prev) => ({ ...prev, [platform]: '' }));
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/webp', 'image/jpeg', 'image/png', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Formato no soportado. Usa JPEG, PNG, WebP o AVIF.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setAvatarError(`Archivo demasiado grande. Máximo 5MB (${(file.size / 1024 / 1024).toFixed(1)}MB).`);
      return;
    }

    setUploadingAvatar(true);
    setAvatarError('');

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setIsDirty(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      const { url } = await response.json();
      URL.revokeObjectURL(previewUrl);
      setAvatarPreview(url);

      await updateSession({ image: url });
    } catch (error: any) {
      setAvatarError(error.message || 'Error al subir la imagen');
      setAvatarPreview(user.avatarUrl);
} finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleCoverClick = () => {
    coverInputRef.current?.click();
  };

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/webp', 'image/jpeg', 'image/png', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      setCoverError('Formato no soportado. Usa JPEG, PNG, WebP o AVIF.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setCoverError(`Archivo demasiado grande. Máximo 5MB (${(file.size / 1024 / 1024).toFixed(1)}MB).`);
      return;
    }

    setUploadingCover(true);
    setCoverError('');

    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);
    setIsDirty(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/profile-cover', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      const { url } = await response.json();
      URL.revokeObjectURL(previewUrl);
      setCoverPreview(url);
    } catch (error: any) {
      setCoverError(error.message || 'Error al subir el banner');
      setCoverPreview(user.coverUrl || null);
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleRemoveCover = async () => {
    setUploadingCover(true);
    try {
      await fetch('/api/upload/profile-cover', { method: 'DELETE' });
      setCoverPreview(null);
      setIsDirty(true);
    } catch {
      setCoverError('Error al eliminar el banner');
    } finally {
      setUploadingCover(false);
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
          avatarUrl: avatarPreview || undefined,
          coverUrl: coverPreview || null,
          bio: formData.bio || undefined,
          website: formData.website || undefined,
          socialLinks: Object.fromEntries(
            Object.entries(socialLinks).filter(([, v]) => v)
          ),
        }),
      });

      if (!response.ok) {
        const { message, details } = await extractApiError(response);
        if (details?.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [field, errors] of Object.entries(details.fieldErrors)) {
            if (errors?.length) mapped[field] = errors[0];
          }
          if (Object.keys(mapped).length > 0) {
            setFieldErrors(mapped);
            throw new Error('Corrige los errores marcados en los campos');
          }
        }
        throw new Error(message);
      }

      const data = await response.json();

      setIsDirty(false);
      setFieldErrors({});
      setSaveStatus('success');
      setFormData((prev) => ({ ...prev, username: data.user.username }));

      const newDisplayName = formData.displayName;
      const newUsername = data.user.username;
      const sessionName = newDisplayName || newUsername || user.displayName || user.username;
      const sessionImage = avatarPreview || user.avatarUrl;
      await updateSession({ name: sessionName, image: sessionImage });

      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'Error al actualizar el perfil');
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
        <AnimatePresence>
          {saveStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              role="status"
              className="p-3 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/30"
            >
              <p className="text-sm text-[var(--success)]">Perfil actualizado correctamente</p>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {saveStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ErrorMessage
                message={saveError || 'Error al actualizar perfil. Inténtalo de nuevo.'}
                onDismiss={() => { setSaveStatus('idle'); setSaveError(null); }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {avatarError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ErrorMessage
                message={avatarError}
                onDismiss={() => setAvatarError('')}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="w-24 h-24 cursor-pointer hover:opacity-90 transition-opacity">
              <AvatarImage src={avatarPreview || undefined} />
              {!avatarPreview && <AvatarFallback className="text-2xl bg-[var(--primary)]" />}
            </Avatar>
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/webp,image/jpeg,image/png,image/avif"
              onChange={handleAvatarFile}
              className="hidden"
            />
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
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[var(--text-primary)]">Foto de perfil</h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              WebP, JPEG, PNG o AVIF. Se comprime automáticamente a 512×512 px.
            </p>
          </div>
        </div>

        {/* Cover photo */}
        <div className="space-y-2">
          <div className="relative rounded-xl overflow-hidden border border-[var(--border)] aspect-[3/1] bg-[var(--surface-sunken)] group">
            {coverPreview ? (
              <img src={coverPreview} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Image className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
                  <p className="text-sm text-[var(--text-tertiary)]">Sin banner</p>
                </div>
              </div>
            )}
            {uploadingCover && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            <div className="absolute inset-0 opacity-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/50 to-transparent hidden sm:block" />
            <div className="absolute bottom-2 right-2 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handleCoverClick}
                disabled={uploadingCover}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4 mr-1.5 inline" />
                {coverPreview ? 'Cambiar' : 'Subir'}
              </button>
              {coverPreview && (
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  disabled={uploadingCover}
                  className="px-3 py-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4 mr-1.5 inline" />
                  Eliminar
                </button>
              )}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/webp,image/jpeg,image/png,image/avif"
              onChange={handleCoverFile}
              className="hidden"
            />
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">
            WebP, JPEG, PNG o AVIF. Se comprime automáticamente a 1500×500 px.
          </p>
          {coverError && (
            <ErrorMessage message={coverError} onDismiss={() => setCoverError('')} />
          )}
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
              className={fieldErrors.displayName ? 'border-[var(--error)]' : ''}
            />
            {fieldErrors.displayName && (
              <p className="text-xs text-[var(--error)]">{fieldErrors.displayName}</p>
            )}
            {!fieldErrors.displayName && (
              <p className="text-xs text-[var(--text-tertiary)]">
                {formData.displayName.length}/50 caracteres
              </p>
            )}
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
                className={`pl-8 ${fieldErrors.username ? 'border-[var(--error)]' : ''}`}
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
            <p id="username-status" className={`text-xs ${fieldErrors.username ? 'text-[var(--error)]' : 'text-[var(--text-tertiary)]'}`}>
              {fieldErrors.username || (usernameChecking
                ? 'Verificando disponibilidad...'
                : usernameAvailable === false
                  ? 'Este nombre de usuario ya está en uso'
                  : 'Mín. 3 caracteres. Solo letras, números y guión bajo.')}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Biografía</Label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            maxLength={500}
            placeholder="Cuéntanos sobre ti..."
            className={`w-full px-3 py-2 rounded-md bg-[var(--surface-sunken)] border ${fieldErrors.bio ? 'border-[var(--error)]' : 'border-[var(--border)]'} text-[var(--text-primary)] resize-none`}
          />
          {fieldErrors.bio && (
            <p className="text-xs text-[var(--error)]">{fieldErrors.bio}</p>
          )}
          {!fieldErrors.bio && (
            <p className="text-xs text-[var(--text-tertiary)]">
              {formData.bio.length}/500 caracteres
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Sitio web</Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <Input
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://tu-sitio.com"
              className={`pl-10 ${fieldErrors.website ? 'border-[var(--error)]' : ''}`}
            />
          </div>
          {fieldErrors.website && (
            <p className="text-xs text-[var(--error)]">{fieldErrors.website}</p>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t border-[var(--border)]">
          <div>
            <h3 className="font-medium text-[var(--text-primary)]">Redes sociales</h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              Añade enlaces a tus redes sociales para que otros usuarios te encuentren
            </p>
          </div>
          {SOCIAL_PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            return (
              <div key={platform.id} className="space-y-2">
                <Label htmlFor={`social-${platform.id}`} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[var(--text-secondary)]" />
                  {platform.label}
                </Label>
                <Input
                  id={`social-${platform.id}`}
                  value={socialLinks[platform.id] || ''}
                  onChange={(e) => handleSocialChange(platform.id, e.target.value)}
                  placeholder={platform.placeholder}
                  className={fieldErrors[platform.id] ? 'border-[var(--error)]' : ''}
                />
                {fieldErrors[platform.id] && (
                  <p className="text-xs text-[var(--error)]">{fieldErrors[platform.id]}</p>
                )}
              </div>
            );
          })}
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
                bio: user.bio || '',
                website: user.website || '',
              });
              setSocialLinks(parseSocialLinks());
              setAvatarPreview(user.avatarUrl);
              setAvatarError('');
              setFieldErrors({});
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
