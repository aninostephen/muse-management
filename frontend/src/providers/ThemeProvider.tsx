import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';

type ColorMode = 'light' | 'dark';

interface ThemeModeContextValue {
  mode: ColorMode;
  toggleMode: () => void;
  setMode: (mode: ColorMode) => void;
}

const THEME_STORAGE_KEY = 'muse_agency_theme_mode';

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(
  undefined,
);

export function AstryxThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'dark' || saved === 'light' ? saved : 'light';
  });

  const setMode = useCallback((nextMode: ColorMode) => {
    localStorage.setItem(THEME_STORAGE_KEY, nextMode);
    setModeState(nextMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode, setMode }}>
      <Theme theme={neutralTheme} mode={mode}>
        {children}
      </Theme>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode(): ThemeModeContextValue {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) {
    throw new Error('useThemeMode must be used within an AstryxThemeProvider');
  }
  return ctx;
}
