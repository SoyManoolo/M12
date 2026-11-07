import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, themeStorageKey, useTheme } from './useTheme';

function Control() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>{theme}</button>;
}

describe('preferencia de apariencia', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('empieza en claro y guarda el cambio a oscuro', () => {
    render(<ThemeProvider><Control /></ThemeProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'light' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(themeStorageKey)).toBe('dark');
  });

  it('recupera la preferencia guardada aunque el documento se haya recreado', () => {
    localStorage.setItem(themeStorageKey, 'dark');
    render(<ThemeProvider><Control /></ThemeProvider>);
    expect(screen.getByRole('button').textContent).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('permite cambiar de tema con el almacenamiento bloqueado', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    render(<ThemeProvider><Control /></ThemeProvider>);
    fireEvent.click(screen.getByRole('button'));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('sincroniza los cambios y el borrado de preferencias en otra pestaña', () => {
    render(<ThemeProvider><Control /></ThemeProvider>);
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: themeStorageKey, newValue: 'dark' })));
    expect(document.documentElement.dataset.theme).toBe('dark');
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: null })));
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
