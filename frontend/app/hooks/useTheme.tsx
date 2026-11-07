import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null);
export const themeStorageKey = 'friendsgo-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    let saved: Theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    try { saved = localStorage.getItem(themeStorageKey) === 'dark' ? 'dark' : 'light'; } catch { /* Conservar el tema del documento. */ }
    document.documentElement.dataset.theme = saved;
    setTheme(saved);
    const syncTheme = (event: StorageEvent) => {
      if (event.key !== themeStorageKey && event.key !== null) return;
      const next = event.newValue === 'dark' ? 'dark' : 'light';
      document.documentElement.dataset.theme = next;
      setTheme(next);
    };
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try { localStorage.setItem(themeStorageKey, next); } catch { /* El tema funciona sin almacenamiento. */ }
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme requiere ThemeProvider');
  return context;
}
