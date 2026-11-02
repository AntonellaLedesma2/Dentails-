import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const light = { mode: 'light', background: '#F4F7FB', surface: '#FFFFFF', text: '#263653', muted: '#8190A9', border: '#E8EDF4', soft: '#EAF1FF', primary: '#2458D3' };
const dark = { mode: 'dark', background: '#111827', surface: '#1B2433', text: '#F1F5F9', muted: '#A7B2C2', border: '#303B4C', soft: '#26344A', primary: '#8BAEFF' };
const UiContext = createContext(null);

export function AppUiProvider({ children }) {
  const [mode, setMode] = useState('light');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollTarget = useRef(null);
  useEffect(() => { AsyncStorage.getItem('dentalis-theme').then((saved) => { if (saved === 'dark' || saved === 'light') setMode(saved); }).catch(() => {}); }, []);
  const reportScroll = useCallback((offset, scrollToTop) => {
    scrollTarget.current = scrollToTop;
    setShowScrollTop((visible) => (offset > 220) === visible ? visible : offset > 220);
  }, []);
  const hideScrollTop = useCallback(() => setShowScrollTop(false), []);
  const scrollToTop = useCallback(() => scrollTarget.current?.(), []);
  const value = useMemo(() => ({
    mode,
    colors: mode === 'dark' ? dark : light,
    toggleTheme: () => setMode((current) => { const next = current === 'dark' ? 'light' : 'dark'; AsyncStorage.setItem('dentalis-theme', next).catch(() => {}); return next; }),
    showScrollTop,
    reportScroll,
    hideScrollTop,
    scrollToTop,
  }), [mode, showScrollTop, reportScroll, hideScrollTop, scrollToTop]);
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useAppUi() { return useContext(UiContext) || { mode: 'light', colors: light, toggleTheme: () => {}, showScrollTop: false, reportScroll: () => {}, hideScrollTop: () => {}, scrollToTop: () => {} }; }
