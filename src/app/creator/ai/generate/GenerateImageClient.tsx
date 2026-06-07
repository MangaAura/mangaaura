'use client';

import {
  motion,
  AnimatePresence,
} from 'framer-motion';
import {
  Sparkles,
  ImageIcon,
  Loader2,
  ChevronDown,
  Check,
  Zap,
  AlertCircle,
  RefreshCw,
  Download,
  Copy,
  Eye,
  History,
  Coins,
  Sparkle,
  Palette,
  Maximize2,
  Minimize2,
  Info,
  Wand2,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import useSWR from 'swr';

import { useAuraBalance } from '@/hooks/useAuraBalance';
import { Container } from '@/components/Layout/Container';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useT } from '@/i18n';
import { fetcher } from '@/lib/swr-config';

// ─── Types ──────────────────────────────────────────────────────────────

interface GenerationModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  auraCost: number;
  qualities: string[];
  styles: string[];
  maxWidth: number;
  maxHeight: number;
  supportsNegativePrompt: boolean;
  supportsSeed: boolean;
}

interface GenerationResponse {
  success: boolean;
  id: string;
  imageUrl?: string;
  seed?: number;
  auraCost: number;
  modelName: string;
  provider: string;
  status: string;
  error?: string;
  auraRefunded?: number;
}

interface HistoryItem {
  id: string;
  prompt: string;
  modelId: string;
  provider: string;
  imageUrl: string | null;
  auraCost: number;
  status: string;
  createdAt: string;
  width: number;
  height: number;
  quality: string;
  style: string | null;
}

interface HistoryResponse {
  items: HistoryItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ─── Client Component ───────────────────────────────────────────────────

export function GenerateImageClient() {
  const t = useT();

  // ── Preset prompts (i18n) ─────────────────────────────────────────
  const PRESET_PROMPTS = [
    t('creator.imageGeneration.presetPrompt1'),
    t('creator.imageGeneration.presetPrompt2'),
    t('creator.imageGeneration.presetPrompt3'),
    t('creator.imageGeneration.presetPrompt4'),
    t('creator.imageGeneration.presetPrompt5'),
    t('creator.imageGeneration.presetPrompt6'),
  ];
  const { auraBalance, refreshBalance } = useAuraBalance();

  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────

  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('gemini/nano-banana-standard');
  const [quality, setQuality] = useState('standard');
  const [style, setStyle] = useState('anime');
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showNegative, setShowNegative] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isAuraError, setIsAuraError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Inline i18n options ────────────────────────────────────────────
  const STYLE_OPTIONS: Array<{ value: string; label: string; icon: typeof Palette }> = [
    { value: 'vivid', label: t('creator.imageGeneration.styleVivid'), icon: Sparkle },
    { value: 'natural', label: t('creator.imageGeneration.styleNatural'), icon: ImageIcon },
    { value: 'anime', label: t('creator.imageGeneration.styleAnime'), icon: Palette },
    { value: 'manga', label: t('creator.imageGeneration.styleManga'), icon: Wand2 },
  ];

  const QUALITY_OPTIONS = [
    { value: 'standard', label: t('creator.imageGeneration.qualityStandard'), description: t('creator.imageGeneration.qualityStandardDesc') },
    { value: 'hd', label: t('creator.imageGeneration.qualityHD'), description: t('creator.imageGeneration.qualityHDDesc') },
    { value: 'ultra', label: t('creator.imageGeneration.qualityUltra'), description: t('creator.imageGeneration.qualityUltraDesc') },
  ];

  // ── Fetch models from the API ──────────────────────────────────────
  // We load model list from the backend config
  const { data: models = [] } = useSWR<GenerationModel[]>(
    '/api/ai/generate-image/models',
    fetcher,
    { revalidateOnFocus: false }
  );

  // ── Fetch history ──────────────────────────────────────────────────
  const { data: historyData, mutate: refreshHistory } = useSWR<HistoryResponse>(
    showHistory ? '/api/ai/generate-image?limit=20' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // ── Derived ────────────────────────────────────────────────────────
  const selectedModel = models.find((m) => m.id === selectedModelId) || {
    id: selectedModelId,
    name: 'Nano Banana Pro',
    description: t('creator.imageGeneration.modelGeminiDesc'),
    provider: 'gemini',
    auraCost: 8,
    qualities: ['standard', 'hd', 'ultra'],
    styles: ['vivid', 'natural', 'anime', 'manga'],
    maxWidth: 1024,
    maxHeight: 1024,
    supportsNegativePrompt: true,
    supportsSeed: false,
  };

  const insufficientAura = auraBalance < selectedModel.auraCost;

  // ── Handlers ───────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setIsAuraError(false);

    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          negativePrompt: negativePrompt.trim() || undefined,
          modelId: selectedModelId,
          width,
          height,
          quality,
          style: selectedModel.styles.includes(style) ? style : undefined,
          seed: seed || undefined,
        }),
      });

      const data: GenerationResponse = await res.json();

      if (!res.ok) {
        setIsAuraError(data.error === t('creator.imageGeneration.auraInsufficient'));
        if (data.error === t('creator.imageGeneration.auraInsufficient')) {
          setError(t('creator.imageGeneration.auraInsufficientDesc', { cost: data.auraCost, balance: auraBalance }));
        } else {
          setError(data.error || t('creator.imageGeneration.generatingError'));
        }
        setIsGenerating(false);
        return;
      }

      setResult(data);
      setIsGenerating(false);

      // Refresh balance immediately so the user sees their deducted Aura
      refreshBalance();

      // Scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);

      // Refresh history
      refreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('creator.imageGeneration.connectionError'));
      setIsGenerating(false);
    }
  }, [prompt, negativePrompt, selectedModelId, width, height, quality, style, seed, isGenerating, auraBalance, refreshBalance, refreshHistory, selectedModel.styles]);

  const handleDownload = useCallback(async () => {
    if (!result?.imageUrl) return;

    try {
      const response = await fetch(result.imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mangaaura-${result.id.substring(0, 8)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // If download fails, open in new tab
      window.open(result.imageUrl, '_blank');
    }
  }, [result]);

  const handleCopyPrompt = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // ── Auto-resize textarea ───────────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  // ── Keyboard shortcut ─────────────────────────────────────────────
  const generateRef = useRef(handleGenerate);
  generateRef.current = handleGenerate;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        generateRef.current();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <Container className="py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <h1 className="text-2xl font-bold">{t('creator.imageGeneration.title')}</h1>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              {t('creator.imageGeneration.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Aura balance */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold">{auraBalance.toLocaleString()}</span>
              <span className="text-xs text-[var(--text-tertiary)]">{t('creator.imageGeneration.aura')}</span>
            </div>

            {/* History button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="gap-2"
            >
              <History className="w-4 h-4" />
              {t('common.history')}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Left Column: Input ─────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main prompt */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-3">
                <Label htmlFor="prompt" className="text-sm font-semibold flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-[var(--primary)]" />
                  {t('creator.imageGeneration.prompt')}
                </Label>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {prompt.length}/4000
                </span>
              </div>

              <textarea
                ref={textareaRef}
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="{t('creator.imageGeneration.promptPlaceholder')}"
                className="w-full min-h-[120px] p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border)] text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 placeholder:text-[var(--text-tertiary)]"
                maxLength={4000}
                disabled={isGenerating}
              />

              {/* Preset prompts */}
              <div className="mt-3">
                <p className="text-xs text-[var(--text-tertiary)] mb-2">{t('creator.imageGeneration.quickSuggestions')}</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_PROMPTS.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(preset)}
                      className="px-3 py-1.5 text-xs rounded-full bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/30 hover:text-[var(--text-primary)] transition-colors"
                    >
                      {preset.length > 40 ? preset.substring(0, 40) + '...' : preset}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Advanced options */}
            <Card className="p-6">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-semibold w-full text-left"
              >
                <SlidersHorizontal className="w-4 h-4 text-[var(--text-tertiary)]" />
                {t('creator.imageGeneration.advancedOptions')}
                <ChevronDown
                  className={`w-4 h-4 ml-auto transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {/* Width */}
                      <div>
                        <Label className="text-xs">{t('creator.imageGeneration.width')}</Label>
                        <Input
                          type="number"
                          value={width}
                          onChange={(e) => setWidth(Number(e.target.value))}
                          min={256}
                          max={selectedModel.maxWidth}
                          step={64}
                          className="mt-1"
                        />
                      </div>

                      {/* Height */}
                      <div>
                        <Label className="text-xs">{t('creator.imageGeneration.height')}</Label>
                        <Input
                          type="number"
                          value={height}
                          onChange={(e) => setHeight(Number(e.target.value))}
                          min={256}
                          max={selectedModel.maxHeight}
                          step={64}
                          className="mt-1"
                        />
                      </div>

                      {/* Seed */}
                      {selectedModel.supportsSeed && (
                        <div>
                          <Label className="text-xs">{t('creator.imageGeneration.seed')}</Label>
                          <Input
                            type="number"
                            value={seed ?? ''}
                            onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : undefined)}
                            placeholder={t('creator.imageGeneration.seedPlaceholder')}
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>

                    {/* Negative prompt */}
                    <button
                      onClick={() => setShowNegative(!showNegative)}
                      className="mt-4 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      {showNegative ? t('creator.imageGeneration.hideNegative') : t('creator.imageGeneration.showNegative')}
                    </button>

                    {showNegative && (
                      <div className="mt-2">
                        <textarea
                          value={negativePrompt}
                          onChange={(e) => setNegativePrompt(e.target.value)}
                          placeholder="{t('creator.imageGeneration.negativePromptPlaceholder')}"
                          className="w-full min-h-[60px] p-3 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border)] text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 placeholder:text-[var(--text-tertiary)]"
                          maxLength={1000}
                          disabled={isGenerating || !selectedModel.supportsNegativePrompt}
                        />
                        {!selectedModel.supportsNegativePrompt && (
                          <p className="text-xs text-amber-500 mt-1">
                            {t('creator.imageGeneration.negativePromptNotSupported')}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Generate / Buy Aura button */}
            {insufficientAura ? (
              <button
                type="button"
                onClick={() => router.push('/checkout')}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-base hover:from-amber-400 hover:to-orange-500 transition-all shadow-lg shadow-amber-500/25"
              >
                <Coins className="w-5 h-5" />
                <span>{t('creator.imageGeneration.buyAura')}</span>
                <span className="text-xs opacity-80 ml-auto">
                  {t('creator.imageGeneration.insufficientAura')}
                </span>
              </button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                size="lg"
                className="w-full gap-3 text-base"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('creator.imageGeneration.generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {t('creator.imageGeneration.generate')}
                    <span className="text-xs opacity-80 ml-auto">
                      ({t('creator.imageGeneration.auraCost', { cost: selectedModel.auraCost })})
                    </span>
                  </>
                )}
              </Button>
            )}

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('creator.imageGeneration.error')}</p>
                    <p>{error}</p>
                    {isAuraError && (
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => router.push('/checkout')}
                          className="gap-1.5"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          {t('creator.imageGeneration.buyAura')}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => { setError(null); setIsAuraError(false); }}>{t('creator.imageGeneration.close')}</Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Result */}
            <AnimatePresence>
              {result?.imageUrl && (
                <motion.div
                  ref={resultRef}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <Card className={`overflow-hidden ${fullscreen ? 'fixed inset-4 z-50 flex items-center justify-center bg-black/90' : ''}`}>
                    <div className="relative group">
                      <img
                        src={result.imageUrl}
                        alt={prompt}
                        className={`w-full object-contain ${fullscreen ? 'max-h-[90vh]' : 'max-h-[500px]'} rounded-t-xl`}
                      />

                      {/* Overlay actions */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => setFullscreen(!fullscreen)}
                          className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
                          title={fullscreen ? t('creator.imageGeneration.fullscreenExit') : t('creator.imageGeneration.fullscreen')}
                        >
                          {fullscreen ? <Minimize2 className="w-5 h-5 text-white" /> : <Maximize2 className="w-5 h-5 text-white" />}
                        </button>
                        <button
                          onClick={handleDownload}
                          className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
                          title={t('creator.imageGeneration.downloadImage')}
                        >
                          <Download className="w-5 h-5 text-white" />
                        </button>
                      </div>

                      {/* Status badge */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/80 text-white backdrop-blur-sm">
                          {result.modelName}
                        </span>
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500/80 text-white backdrop-blur-sm">
                          -{t('creator.imageGeneration.auraCost', { cost: result.auraCost })}
                        </span>
                      </div>
                    </div>

                    {/* Result info */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <button
                            onClick={() => handleCopyPrompt(prompt)}
                            className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            {copied ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-500" />
                                <span className="text-emerald-500">{t('creator.imageGeneration.copied')}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                {t('creator.imageGeneration.copyPrompt')}
                              </>
                            )}
                          </button>
                          {result.seed && (
                            <span className="text-[var(--text-tertiary)]">
                              · Seed: {result.seed}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-[var(--text-tertiary)] line-clamp-2">
                        {prompt}
                      </p>

                      <div className="flex gap-2">
                        <Button onClick={handleDownload} variant="secondary" size="sm" className="gap-2">
                          <Download className="w-4 h-4" />{t('creator.imageGeneration.download')}</Button>
                        <Button
                          onClick={() => {
                            setPrompt(prompt);
                            handleGenerate();
                          }}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={isGenerating}
                        >
                          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />{t('creator.imageGeneration.regenerate')}</Button>
                        <Button
                          onClick={() => {
                            setPrompt('');
                            setResult(null);
                            setError(null);
                            setIsAuraError(false);
                          }}
                          variant="ghost"
                          size="sm"
                          className="gap-2 ml-auto"
                        >
                          <X className="w-4 h-4" />{t('creator.imageGeneration.newImage')}</Button>
                      </div>
                    </div>
                  </Card>

                  {/* Fullscreen backdrop */}
                  {fullscreen && (
                    <div
                      className="fixed inset-0 bg-black/80 z-40"
                      onClick={() => setFullscreen(false)}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right Column: Model & Settings ─────────────────────────── */}
          <div className="space-y-6">
            {/* Model Selection */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[var(--primary)]" />{t('creator.imageGeneration.model')}</h3>
              <div className="space-y-2">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModelId(model.id);
                      // Auto-adjust resolution to model max
                      if (width > model.maxWidth) setWidth(model.maxWidth);
                      if (height > model.maxHeight) setHeight(model.maxHeight);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedModelId === model.id
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-sm'
                        : 'border-[var(--border)] hover:border-[var(--primary)]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          model.provider === 'openai' ? 'bg-emerald-500' : 'bg-blue-500'
                        }`} />
                        <span className="text-sm font-medium">{model.name}</span>
                      </div>
                      {selectedModelId === model.id && (
                        <Check className="w-4 h-4 text-[var(--primary)]" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">{model.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {auraBalance >= model.auraCost ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Check className="w-2.5 h-2.5" />
                          {t('creator.imageGeneration.auraCost', { cost: model.auraCost })}
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 dark:text-red-400 cursor-help"
                          title={t('creator.imageGeneration.insufficientAura')}
                        >
                          <Coins className="w-2.5 h-2.5" />
                          {t('creator.imageGeneration.auraCost', { cost: model.auraCost })}
                        </span>
                      )}
                      <span className="text-[10px] text-[var(--text-tertiary)] uppercase">
                        {model.provider}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Style Selection */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-[var(--primary)]" />{t('creator.imageGeneration.style')}</h3>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_OPTIONS.filter((s) => selectedModel.styles.includes(s.value)).map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setStyle(opt.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                        style === opt.value
                          ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/30'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${style === opt.value ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}`} />
                      <span className="text-xs font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Quality Selection */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-[var(--primary)]" />{t('creator.imageGeneration.quality')}</h3>
              <div className="space-y-2">
                {QUALITY_OPTIONS.map((opt) => {
                  const isDisabled = !selectedModel.qualities.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      disabled={isDisabled}
                      onClick={() => setQuality(opt.value)}
                      className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isDisabled
                          ? 'opacity-40 cursor-not-allowed'
                          : quality === opt.value
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                            : 'border-[var(--border)] hover:border-[var(--primary)]/30'
                      }`}
                    >
                      <div>
                        <span className="text-sm font-medium">{opt.label}</span>
                        <p className="text-xs text-[var(--text-tertiary)]">{opt.description}</p>
                      </div>
                      {quality === opt.value && !isDisabled && (
                        <Check className="w-4 h-4 text-[var(--primary)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>

        {/* ── History Panel ───────────────────────────────────────────── */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-8"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <History className="w-4 h-4" />
                    {t('creator.imageGeneration.history')}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {!historyData?.items?.length ? (
                  <div className="text-center py-12 text-[var(--text-tertiary)]">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{t('creator.imageGeneration.historyEmpty')}</p>
                    <p className="text-xs mt-1">{t('creator.imageGeneration.historyEmptySub')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {historyData.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.imageUrl) {
                            setResult({
                              success: true,
                              id: item.id,
                              imageUrl: item.imageUrl,
                              auraCost: item.auraCost,
                              modelName: item.modelId,
                              provider: item.provider,
                              status: item.status,
                            });
                            setPrompt(item.prompt);
                            setShowHistory(false);
                          }
                        }}
                        className="group relative aspect-square rounded-xl overflow-hidden border border-[var(--border)]"
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.prompt}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[var(--surface-sunken)] flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-[var(--text-tertiary)]" />
                          </div>
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <div className="text-white text-[10px] truncate w-full">
                            <Eye className="w-3 h-3 inline mr-1" />
                            {t('creator.imageGeneration.auraCost', { cost: item.auraCost })}
                          </div>
                        </div>

                        {/* Status */}
                        {item.status === 'FAILED' && (
                          <div className="absolute top-1 right-1">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </Container>
    </div>
  );
}
