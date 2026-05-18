'use client';

import { useState, useCallback, useEffect } from 'react';

import type { PanelText } from '@/components/Reader/PanelTextOverlay';

interface UsePanelTextsOptions {
  initialTexts?: PanelText[];
  onSave?: (texts: PanelText[]) => Promise<void>;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export function usePanelTexts(options: UsePanelTextsOptions = {}) {
  const { 
    initialTexts = [], 
    onSave, 
    autoSave = false, 
    autoSaveDelay = 2000 
  } = options;
  
  const [texts, setTexts] = useState<PanelText[]>(initialTexts);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !isDirty || !onSave) return;

    const timer = setTimeout(async () => {
      await saveTexts();
    }, autoSaveDelay);

    return () => clearTimeout(timer);
  }, [texts, isDirty, autoSave, autoSaveDelay, onSave]);

  const updateTexts = useCallback((newTexts: PanelText[] | ((prev: PanelText[]) => PanelText[])) => {
    setTexts(prev => {
      const updated = typeof newTexts === 'function' ? newTexts(prev) : newTexts;
      if (JSON.stringify(updated) !== JSON.stringify(prev)) {
        setIsDirty(true);
      }
      return updated;
    });
  }, []);

  const addText = useCallback((text: Omit<PanelText, 'id'>) => {
    const newText: PanelText = {
      ...text,
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    updateTexts(prev => [...prev, newText]);
    return newText.id;
  }, [updateTexts]);

  const updateText = useCallback((id: string, updates: Partial<PanelText>) => {
    updateTexts(prev => 
      prev.map(t => t.id === id ? { ...t, ...updates } : t)
    );
  }, [updateTexts]);

  const deleteText = useCallback((id: string) => {
    updateTexts(prev => prev.filter(t => t.id !== id));
  }, [updateTexts]);

  const reorderTexts = useCallback((startIndex: number, endIndex: number) => {
    updateTexts(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, [updateTexts]);

  const clearTexts = useCallback(() => {
    updateTexts([]);
  }, [updateTexts]);

  const resetToInitial = useCallback(() => {
    setTexts(initialTexts);
    setIsDirty(false);
  }, [initialTexts]);

  const saveTexts = useCallback(async () => {
    if (!onSave || isSaving) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      await onSave(texts);
      setIsDirty(false);
      setLastSaved(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving texts');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [texts, onSave, isSaving]);

  const exportAsJSON = useCallback(() => {
    return JSON.stringify(texts, null, 2);
  }, [texts]);

  const importFromJSON = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as PanelText[];
      if (!Array.isArray(parsed)) {
        throw new Error('Invalid format: expected array');
      }
      updateTexts(parsed);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error importing texts');
      return false;
    }
  }, [updateTexts]);

  const getTextsByType = useCallback((type: PanelText['type']) => {
    return texts.filter(t => t.type === type);
  }, [texts]);

  const duplicateText = useCallback((id: string) => {
    const text = texts.find(t => t.id === id);
    if (!text) return null;
    
    const newText: PanelText = {
      ...text,
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: text.x + 5,
      y: text.y + 5,
    };
    updateTexts(prev => [...prev, newText]);
    return newText.id;
  }, [texts, updateTexts]);

  return {
    // State
    texts,
    isDirty,
    isSaving,
    lastSaved,
    error,
    
    // Actions
    setTexts: updateTexts,
    addText,
    updateText,
    deleteText,
    reorderTexts,
    clearTexts,
    resetToInitial,
    saveTexts,
    
    // Import/Export
    exportAsJSON,
    importFromJSON,
    
    // Utilities
    getTextsByType,
    duplicateText,
  };
}

export default usePanelTexts;
