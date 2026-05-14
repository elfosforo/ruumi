import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const COLORS = {
  night: {
    background: '#0F0F13',
    card: '#1A1A1F',
    text: '#FFFFFF',
    textSecondary: '#888888',
    primary: '#E0FF00', // Neon Yellow
    secondary: '#FF007A', // Neon Pink
    accent: '#00E5FF', // Neon Cyan
    border: '#333333',
  },
  day: {
    background: '#F0F4F8', // Cold White/Gray
    card: '#FFFFFF',
    text: '#000000',
    textSecondary: '#4A5568',
    primary: '#000000', // Black as main accent
    secondary: '#FF5722', // Deep Orange
    accent: '#3F51B5', // Indigo
    border: '#000000',
  }
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const BORDERS = {
  radius: 16,
  width: 2,
};

type ThemeType = 'night' | 'day';

interface ThemeContextType {
  theme: ThemeType;
  colors: typeof COLORS.night;
  spacing: typeof SPACING;
  borders: typeof BORDERS;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('night');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('@ruumi_theme');
        if (saved) {
          const parsed = saved.startsWith('"') ? JSON.parse(saved) : saved;
          setTheme(parsed as ThemeType);
        }
      } catch (e) {}
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'night' ? 'day' : 'night';
    setTheme(newTheme);
    await AsyncStorage.setItem('@ruumi_theme', JSON.stringify(newTheme));
  };

  const colors = theme === 'night' ? COLORS.night : COLORS.day;

  return (
    <ThemeContext.Provider value={{ theme, colors, spacing: SPACING, borders: BORDERS, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
