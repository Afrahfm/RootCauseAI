import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('rootcauseai_settings');
    return saved ? JSON.parse(saved) : {
      theme: 'dark',
      compactMode: false,
      emailNotifications: true,
      analysisAlerts: true
    };
  });

  const applyTheme = (theme) => {
    const root = window.document.documentElement;
    let actualTheme = theme;
    
    if (theme === 'system') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    root.classList.remove('light', 'dark');
    root.classList.add(actualTheme);
    root.style.colorScheme = actualTheme;
  };

  useEffect(() => {
    localStorage.setItem('rootcauseai_settings', JSON.stringify(settings));
    applyTheme(settings.theme);
  }, [settings]);

  // Listen for system theme changes if in system mode
  useEffect(() => {
    if (settings.theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <ThemeContext.Provider value={{ settings, updateSettings }}>
      <div className={`${settings.compactMode ? 'compact-mode' : ''} min-h-screen transition-colors duration-300`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
