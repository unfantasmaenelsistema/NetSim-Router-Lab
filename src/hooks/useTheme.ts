import { useState, useEffect } from 'react';
import { ThemeMode } from '../components/ThemeSelector';

const STORAGE_KEY = 'netsim_theme';

export function useTheme() {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system';
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
        return saved;
      }
    } catch (e) {
      console.warn('Could not read theme from localStorage', e);
    }
    return 'system';
  });

  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (themeMode === 'system') {
      return getSystemTheme();
    }
    return themeMode;
  });

  useEffect(() => {
    const updateResolvedTheme = () => {
      const effective = themeMode === 'system' ? getSystemTheme() : themeMode;
      setResolvedTheme(effective);

      // Apply to document root
      const root = document.documentElement;
      root.setAttribute('data-theme', effective);
      if (effective === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    };

    updateResolvedTheme();

    // Listen for OS color scheme preference changes
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleMediaChange = () => {
        if (themeMode === 'system') {
          updateResolvedTheme();
        }
      };

      mediaQuery.addEventListener('change', handleMediaChange);
      return () => mediaQuery.removeEventListener('change', handleMediaChange);
    }
  }, [themeMode]);

  const setThemeMode = (newMode: ThemeMode) => {
    setThemeModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch (e) {
      console.warn('Could not save theme to localStorage', e);
    }
  };

  return {
    themeMode,
    setThemeMode,
    resolvedTheme
  };
}
