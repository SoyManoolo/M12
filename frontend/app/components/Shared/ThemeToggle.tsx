import { useTheme } from '~/hooks/useTheme';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button type="button" onClick={toggleTheme} className={`theme-toggle ${className}`}
      aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
      aria-pressed={theme === 'dark'}>
      <span className="theme-toggle-icon" aria-hidden="true" />
      <span>{theme === 'light' ? 'Claro' : 'Oscuro'}</span>
    </button>
  );
}
