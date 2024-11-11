// src/components/ThemeSwitcher.tsx

import { useEffect, usePulse } from 'core/hooks';
import { FunctionalComponent } from 'core/types';
import { appStore } from '../store';

export const ThemeSwitcher: FunctionalComponent = () => {
  const [theme, setTheme] = usePulse('theme', appStore);

  useEffect(() => {
    console.log('theme', theme);
    const applyTheme = () => {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
  }, [theme]);

  return (
    <button
      className={`px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        theme === 'light'
          ? 'bg-gray-800 text-white'
          : 'bg-yellow-300 text-black'
      }`}
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
    </button>
  );
};
