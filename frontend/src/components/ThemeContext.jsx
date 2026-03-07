// TemaDom v7.0 — Premium Theme Context (Dark/Light mode)
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('temadom-theme');
    if (saved) return saved === 'dark';
    return true; // Default to dark mode
  });

  useEffect(() => {
    localStorage.setItem('temadom-theme', dark ? 'dark' : 'light');
    document.documentElement.classList.toggle('light-mode', !dark);
  }, [dark]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (!localStorage.getItem('temadom-theme')) setDark(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggle = () => setDark(d => !d);

  const t = dark ? {
    bg: '#0f1115', bgCard: '#161a23', bgSurface: '#1b1f2a',
    border: '#252a36', text: '#ffffff', textMuted: '#c9ced6', textSubtle: '#8f96a3',
    accent: '#ff8a00', accentGlow: '#ff8a00', gold: '#f6c36a', goldEnd: '#e0a94a',
    green: '#10B981', red: '#EF4444',
  } : {
    bg: '#f6f7fb', bgCard: '#ffffff', bgSurface: '#eef0f5',
    border: '#d1d5e0', text: '#111318', textMuted: '#6b7280', textSubtle: '#9ca3af',
    accent: '#e67a00', accentGlow: '#e67a00', gold: '#d4a23a', goldEnd: '#c4912f',
    green: '#10B981', red: '#EF4444',
  };

  return (
    <ThemeContext.Provider value={{ dark, toggle, t }}>
      {children}
    </ThemeContext.Provider>
  );
};
