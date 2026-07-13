import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import './ThemeToggle.css';

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <motion.button
      className='theme-toggle'
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label='Toggle Theme'
    >
      <div className='toggle-icon-container'>
        {theme === 'dark' ? (
          <Moon size={20} className='icon neon-cobalt' />
        ) : (
          <Sun size={20} className='icon neon-sunrise' />
        )}
      </div>
    </motion.button>
  );
};

export default ThemeToggle;