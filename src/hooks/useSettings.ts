import { useState, useEffect, useCallback } from 'react';
import type { TrackingSettings } from '../models';
import { DEFAULT_NOTIFICATION_THRESHOLD, DEFAULT_FIRST_DAY_OF_WEEK } from '../utils/constants';

const SETTINGS_KEY = 'timetracker-settings';

// Default settings
const DEFAULT_SETTINGS: TrackingSettings = {
  maxDuration: 12 * 3600, // 12 hours in seconds
  warningThreshold: 3600, // 1 hour warning
  firstDayOfWeek: DEFAULT_FIRST_DAY_OF_WEEK,
  defaultGoalNotificationThreshold: DEFAULT_NOTIFICATION_THRESHOLD,
  notificationsEnabled: true,
  darkMode: false,
};

// Settings utilities
export const settingsStorage = {
  get: (): TrackingSettings => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (!stored) return DEFAULT_SETTINGS;

      const parsed = JSON.parse(stored);

      // Ensure all required fields exist (for backwards compatibility)
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
      };
    } catch (error) {
      console.warn('Failed to parse settings from localStorage:', error);
      return DEFAULT_SETTINGS;
    }
  },

  set: (settings: TrackingSettings): void => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  },

  reset: (): void => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  },

  // Update individual setting
  update: <K extends keyof TrackingSettings>(
    key: K,
    value: TrackingSettings[K]
  ): TrackingSettings => {
    const current = settingsStorage.get();
    const updated = { ...current, [key]: value };
    settingsStorage.set(updated);
    return updated;
  },
};

// Custom hook for settings management
export const useSettings = () => {
  const [settings, setSettings] = useState<TrackingSettings>(() => settingsStorage.get());

  // Update settings and persist to localStorage
  const updateSettings = useCallback((newSettings: Partial<TrackingSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    settingsStorage.set(updated);
  }, [settings]);

  // Update a single setting
  const updateSetting = useCallback(<K extends keyof TrackingSettings>(
    key: K,
    value: TrackingSettings[K]
  ) => {
    const updated = settingsStorage.update(key, value);
    setSettings(updated);
  }, []);

  // Reset to defaults
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    settingsStorage.set(DEFAULT_SETTINGS);
  }, []);

  // Clear all settings
  const clearSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    settingsStorage.reset();
  }, []);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SETTINGS_KEY) {
        setSettings(settingsStorage.get());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    settings,
    updateSettings,
    updateSetting,
    resetSettings,
    clearSettings,
    // Quick access to commonly used settings
    isDarkMode: settings.darkMode ?? false, // We'll add this to the interface
    notificationsEnabled: settings.notificationsEnabled,
    maxDuration: settings.maxDuration,
    warningThreshold: settings.warningThreshold,
  };
};

export default useSettings;
