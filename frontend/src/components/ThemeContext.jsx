// TemaDom v6.5 — Theme Context (Dark/Light mode)
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('temadom-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
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
    bg: '#0F172A', bgCard: '#1E293B', bgSurface: '#253545',
    border: '#334155', text: '#F8FAFC', textMuted: '#94A3B8',
    accent: '#F97316', accentGlow: '#F97316', gold: '#FCD34D',
    green: '#10B981', red: '#EF4444',
  } : {
    bg: '#F8FAFC', bgCard: '#FFFFFF', bgSurface: '#F1F5F9',
    border: '#E2E8F0', text: '#0F172A', textMuted: '#64748B',
    accent: '#F97316', accentGlow: '#EA580C', gold: '#D97706',
    green: '#10B981', red: '#EF4444',
  };

  return (
    <ThemeContext.Provider value={{ dark, toggle, t }}>
      {children}
    </ThemeContext.Provider>
  );
};
