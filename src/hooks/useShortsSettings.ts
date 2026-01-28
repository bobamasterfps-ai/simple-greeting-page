import { useState, useEffect, useCallback } from 'react';
import { clipDBManager } from '@/lib/clipIndexedDB';
import type { ClipSettings, ClipMode, AspectPreset, FontStyle, SubtitleColor } from '@/types/shortsTypes';
import { DEFAULT_SETTINGS, MODE_CONFIGS } from '@/types/shortsTypes';

export function useShortsSettings() {
  const [settings, setSettings] = useState<ClipSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Load settings from IndexedDB on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await clipDBManager.getSettings();
        if (saved) {
          setSettings({
            ...DEFAULT_SETTINGS,
            mode: (saved.defaultMode as ClipMode) || DEFAULT_SETTINGS.mode,
            preset: mapPreset(saved.defaultPreset),
            fontStyle: (saved.fontStyle as FontStyle) || DEFAULT_SETTINGS.fontStyle,
            subtitleColor: (saved.subtitleColor as SubtitleColor) || DEFAULT_SETTINGS.subtitleColor,
            wordsPerLine: saved.wordsPerLine || DEFAULT_SETTINGS.wordsPerLine,
            enableSubtitles: saved.enableSubtitles ?? DEFAULT_SETTINGS.enableSubtitles,
            audioSensitivity: saved.audioSensitivity || DEFAULT_SETTINGS.audioSensitivity,
          });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Map old preset format to new
  const mapPreset = (oldPreset: string | undefined): AspectPreset => {
    const mapping: Record<string, AspectPreset> = {
      'CROPPED': 'SHORTS',
      'STACKED_FACECAM': 'STACKED',
      'CENTERED': 'SQUARE',
      'FULLSCREEN': 'LANDSCAPE',
    };
    return mapping[oldPreset || ''] || DEFAULT_SETTINGS.preset;
  };

  // Save settings to IndexedDB
  const saveSettings = useCallback(async (newSettings: ClipSettings) => {
    setSettings(newSettings);
    try {
      await clipDBManager.saveSettings({
        defaultMode: newSettings.mode,
        defaultPreset: newSettings.preset === 'SHORTS' ? 'CROPPED' : 
                       newSettings.preset === 'STACKED' ? 'STACKED_FACECAM' :
                       newSettings.preset === 'SQUARE' ? 'CENTERED' : 'FULLSCREEN',
        fontStyle: newSettings.fontStyle,
        subtitleColor: newSettings.subtitleColor,
        wordsPerLine: newSettings.wordsPerLine,
        enableSubtitles: newSettings.enableSubtitles,
        audioSensitivity: newSettings.audioSensitivity,
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, []);

  // Update individual settings
  const updateSetting = useCallback(<K extends keyof ClipSettings>(
    key: K,
    value: ClipSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    
    // Auto-update pre/post roll when mode changes
    if (key === 'mode') {
      const modeConfig = MODE_CONFIGS[value as ClipMode];
      newSettings.preRollMs = modeConfig.preRoll;
      newSettings.postRollMs = modeConfig.postRoll;
    }
    
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  return {
    settings,
    loading,
    updateSetting,
    saveSettings,
  };
}
