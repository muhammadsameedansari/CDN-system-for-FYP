// Theme Context — manages dark/light mode across the whole app
import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

export const THEMES = {
  light: {
    bg:          '#f4f6fb',
    card:        '#ffffff',
    cardBorder:  '#eeeeee',
    text:        '#0f3460',
    textSub:     '#888888',
    topBar:      '#0f3460',
    topBarText:  '#ffffff',
    accent:      '#e94560',
    accentText:  '#ffffff',
    token:       '#0f3460',
    tokenText:   '#64ffda',
    input:       '#fafafa',
    inputBorder: '#e0e0e0',
    inputText:   '#222222',
    divider:     '#eeeeee',
    badge:       'rgba(100,255,218,0.15)',
    badgeBorder: 'rgba(100,255,218,0.3)',
    badgeText:   '#64ffda',
    comingSoon:  '#fff8e1',
    comingSoonBorder: '#ffe082',
    comingSoonText:   '#856404',
    simBar:      '#f0f2f8',
    simBtn:      '#ffffff',
    simBtnText:  '#0f3460',
  },
  dark: {
    bg:          '#0d1117',
    card:        '#161b22',
    cardBorder:  '#21262d',
    text:        '#e6edf3',
    textSub:     '#8b949e',
    topBar:      '#0f3460',
    topBarText:  '#ffffff',
    accent:      '#e94560',
    accentText:  '#ffffff',
    token:       '#0d1f35',
    tokenText:   '#64ffda',
    input:       '#0d1117',
    inputBorder: '#30363d',
    inputText:   '#e6edf3',
    divider:     '#21262d',
    badge:       'rgba(100,255,218,0.1)',
    badgeBorder: 'rgba(100,255,218,0.2)',
    badgeText:   '#64ffda',
    comingSoon:  '#1a1500',
    comingSoonBorder: '#3a2e00',
    comingSoonText:   '#ffd60a',
    simBar:      '#161b22',
    simBtn:      '#21262d',
    simBtnText:  '#e6edf3',
  },
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const theme = isDark ? THEMES.dark : THEMES.light;

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
