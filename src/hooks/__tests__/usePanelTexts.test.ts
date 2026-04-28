import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePanelTexts } from '@/hooks/usePanelTexts';
import type { PanelText } from '@/components/Reader/PanelTextOverlay';

// Mock PanelText type for tests
const createMockPanelText = (overrides: Partial<PanelText> = {}): PanelText => ({
  id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  x: 100,
  y: 100,
  width: 200,
  height: 50,
  text: 'Test text',
  type: 'speech',
  fontSize: 16,
  color: '#000000',
  rotation: 0,
  ...overrides,
});

describe('usePanelTexts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with empty texts by default', () => {
    const { result } = renderHook(() => usePanelTexts());
    expect(result.current.texts).toEqual([]);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastSaved).toBeNull();
  });

  it('initializes with provided initial texts', () => {
    const initialTexts = [createMockPanelText({ text: 'Initial' })];
    const { result } = renderHook(() => usePanelTexts({ initialTexts }));
    expect(result.current.texts).toHaveLength(1);
    expect(result.current.texts[0].text).toBe('Initial');
  });

  it('adds a new text', () => {
    const { result } = renderHook(() => usePanelTexts());

    act(() => {
      result.current.addText({
        x: 50,
        y: 50,
        width: 100,
        height: 30,
        text: 'New text',
        type: 'thought',
        fontSize: 14,
        color: '#ffffff',
        rotation: 45,
      });
    });

    expect(result.current.texts).toHaveLength(1);
    expect(result.current.texts[0].text).toBe('New text');
    expect(result.current.texts[0].type).toBe('thought');
    expect(result.current.isDirty).toBe(true);
    expect(result.current.texts[0].id).toBeDefined();
  });

  it('updates an existing text', () => {
    const initialTexts = [createMockPanelText({ text: 'Original' })];
    const { result } = renderHook(() => usePanelTexts({ initialTexts }));

    const textId = result.current.texts[0].id;

    act(() => {
      result.current.updateText(textId, { text: 'Updated' });
    });

    expect(result.current.texts[0].text).toBe('Updated');
    expect(result.current.texts[0].x).toBe(100); // Original value preserved
    expect(result.current.isDirty).toBe(true);
  });

  it('deletes a text', () => {
    const initialTexts = [
      createMockPanelText({ text: 'Text 1' }),
      createMockPanelText({ text: 'Text 2' }),
    ];
    const { result } = renderHook(() => usePanelTexts({ initialTexts }));

    const textIdToDelete = result.current.texts[0].id;

    act(() => {
      result.current.deleteText(textIdToDelete);
    });

    expect(result.current.texts).toHaveLength(1);
    expect(result.current.texts[0].text).toBe('Text 2');
    expect(result.current.isDirty).toBe(true);
  });

  it('reorders texts', () => {
    const initialTexts = [
      createMockPanelText({ text: 'First' }),
      createMockPanelText({ text: 'Second' }),
      createMockPanelText({ text: 'Third' }),
    ];
    const { result } = renderHook(() => usePanelTexts({ initialTexts }));

    act(() => {
      result.current.reorderTexts(0, 2); // Move first to last
    });

    expect(result.current.texts[0].text).toBe('Second');
    expect(result.current.texts[1].text).toBe('Third');
    expect(result.current.texts[2].text).toBe('First');
  });

  it('clears all texts', () => {
    const initialTexts = [createMockPanelText()];
    const { result } = renderHook(() => usePanelTexts({ initialTexts }));

    act(() => {
      result.current.clearTexts();
    });

    expect(result.current.texts).toEqual([]);
    expect(result.current.isDirty).toBe(true);
  });

  it('resets to initial texts', () => {
    const initialTexts = [createMockPanelText({ text: 'Initial' })];
    const { result } = renderHook(() => usePanelTexts({ initialTexts }));

    act(() => {
      result.current.addText({
        x: 0,
        y: 0,
        width: 100,
        height: 30,
        text: 'Added',
        type: 'speech',
        fontSize: 14,
        color: '#000000',
        rotation: 0,
      });
    });

    expect(result.current.texts).toHaveLength(2);

    act(() => {
      result.current.resetToInitial();
    });

    expect(result.current.texts).toHaveLength(1);
    expect(result.current.texts[0].text).toBe('Initial');
    expect(result.current.isDirty).toBe(false);
  });

  it('exports texts as JSON', () => {
    const initialTexts = [createMockPanelText({ text: 'Export me' })];
    const { result } = renderHook(() => usePanelTexts({ initialTexts }));

    const json = result.current.exportAsJSON();
    const parsed = JSON.parse(json);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].text).toBe('Export me');
  });

  it('imports texts from JSON', () => {
    const textsToImport = [
      createMockPanelText({ text: 'Imported 1' }),
      createMockPanelText({ text: 'Imported 2' }),
    ];
    const json = JSON.stringify(textsToImport);

    const { result } = renderHook(() => usePanelTexts());

    act(() => {
      const success = result.current.importFromJSON(json);
      expect(success).toBe(true);
    });

    expect(result.current.texts).toHaveLength(2);
    expect(result.current.texts[0].text).toBe('Imported 1');
    expect(result.current.isDirty).toBe(true);
  });

  it('handles invalid JSON import', () => {
    const { result } = renderHook(() => usePanelTexts());

    act(() => {
      const success = result.current.importFromJSON('invalid json');
      expect(success).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });

  it('filters texts by type', () => {
    const initialTexts = [
      createMockPanelText({ type: 'speech' }),
      createMockPanelText({ type: 'thought' }),
      createMockPanelText({ type: 'speech' }),
    ];
    const { result } = renderHook(() => usePanelTexts({ initialTexts }));

    const speechTexts = result.current.getTextsByType('speech');
    expect(speechTexts).toHaveLength(2);

    const thoughtTexts = result.current.getTextsByType('thought');
    expect(thoughtTexts).toHaveLength(1);
  });

  it('duplicates a text with offset', () => {
    const initialTexts = [
      createMockPanelText({ x: 100, y: 100, text: 'Original' }),
    ];
    const { result } = renderHook(() => usePanelTexts({ initialTexts }));

    const originalId = result.current.texts[0].id;

    act(() => {
      result.current.duplicateText(originalId);
    });

    expect(result.current.texts).toHaveLength(2);
    expect(result.current.texts[1].text).toBe('Original');
    expect(result.current.texts[1].x).toBe(105); // Original x + 5
    expect(result.current.texts[1].y).toBe(105); // Original y + 5
    expect(result.current.texts[1].id).not.toBe(originalId);
  });

  it('returns null when duplicating non-existent text', () => {
    const { result } = renderHook(() => usePanelTexts());

    const returnValue = result.current.duplicateText('non-existent');
    expect(returnValue).toBeNull();
  });

  it('saves texts successfully', async () => {
    const mockSave = vi.fn().mockResolvedValue(undefined);
    const initialTexts = [createMockPanelText()];

    const { result } = renderHook(() =>
      usePanelTexts({ initialTexts, onSave: mockSave })
    );

    // Make dirty first
    act(() => {
      result.current.addText({
        x: 0,
        y: 0,
        width: 100,
        height: 30,
        text: 'New',
        type: 'speech',
        fontSize: 14,
        color: '#000000',
        rotation: 0,
      });
    });

    await act(async () => {
      await result.current.saveTexts();
    });

    expect(mockSave).toHaveBeenCalledWith(result.current.texts);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.lastSaved).toBeInstanceOf(Date);
    expect(result.current.isSaving).toBe(false);
  });

  it('handles save error', async () => {
    const mockSave = vi.fn().mockRejectedValue(new Error('Save failed'));
    const initialTexts = [createMockPanelText()];

    const { result } = renderHook(() =>
      usePanelTexts({ initialTexts, onSave: mockSave })
    );

    // Make dirty first
    act(() => {
      result.current.addText({
        x: 0,
        y: 0,
        width: 100,
        height: 30,
        text: 'New',
        type: 'speech',
        fontSize: 14,
        color: '#000000',
        rotation: 0,
      });
    });

    await act(async () => {
      try {
        await result.current.saveTexts();
      } catch (e) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Save failed');
    expect(result.current.isSaving).toBe(false);
  });

  it('auto-saves after delay when enabled', async () => {
    vi.useRealTimers();
    const mockSave = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      usePanelTexts({
        onSave: mockSave,
        autoSave: true,
        autoSaveDelay: 100,
      })
    );

    act(() => {
      result.current.addText({
        x: 0,
        y: 0,
        width: 100,
        height: 30,
        text: 'Auto save test',
        type: 'speech',
        fontSize: 14,
        color: '#000000',
        rotation: 0,
      });
    });

    // Should not save immediately
    expect(mockSave).not.toHaveBeenCalled();
    expect(result.current.isDirty).toBe(true);

    // Wait for auto-save to trigger
    await waitFor(() => expect(mockSave).toHaveBeenCalled(), { timeout: 500 });

    vi.useFakeTimers();
  }, 10000);

  it('prevents concurrent saves', async () => {
    let resolveSave: (value: unknown) => void;
    const mockSave = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      })
    );

    const initialTexts = [createMockPanelText()];
    const { result } = renderHook(() =>
      usePanelTexts({ initialTexts, onSave: mockSave })
    );

    // Make dirty
    act(() => {
      result.current.addText({
        x: 0,
        y: 0,
        width: 100,
        height: 30,
        text: 'New',
        type: 'speech',
        fontSize: 14,
        color: '#000000',
        rotation: 0,
      });
    });

    // Start first save - use act to properly handle the async state update
    let savePromise: Promise<void>;
    await act(async () => {
      savePromise = result.current.saveTexts();
    });

    // After act, isSaving should be true
    expect(result.current.isSaving).toBe(true);
    expect(mockSave).toHaveBeenCalledTimes(1);

    // Try second save while first is in progress - should not call onSave again
    await act(async () => {
      await result.current.saveTexts();
    });
    expect(mockSave).toHaveBeenCalledTimes(1);

    // Resolve first save
    resolveSave!(undefined);
    await act(async () => {
      await savePromise!;
    });

    expect(result.current.isSaving).toBe(false);
  });

  it('cleans up auto-save timer on unmount', () => {
    const mockSave = vi.fn().mockResolvedValue(undefined);

    const { unmount } = renderHook(() =>
      usePanelTexts({
        onSave: mockSave,
        autoSave: true,
        autoSaveDelay: 1000,
      })
    );

    unmount();

    // Advance timers - should not throw
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockSave).not.toHaveBeenCalled();
  });

  it('updates texts using function callback', () => {
    const initialTexts = [createMockPanelText({ text: 'Original' })];
    const { result } = renderHook(() => usePanelTexts({ initialTexts }));

    act(() => {
      result.current.setTexts((prev) =>
        prev.map((t) => ({ ...t, text: 'Mapped' }))
      );
    });

    expect(result.current.texts[0].text).toBe('Mapped');
  });
});
