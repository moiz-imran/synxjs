import { usePulseEffect, usePulseState } from 'core/hooks';
import { FunctionalComponent } from 'core/types';
import { appStore } from '../store';

const applyTheme = (theme: string): void => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const ThemeSwitcher: FunctionalComponent = () => {
  const [theme, setTheme] = usePulseState('theme', appStore);

  usePulseEffect(() => {
    applyTheme(theme);
  });

  return (
    <button
      className="px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gray-800 text-white dark:bg-yellow-300 dark:text-black"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
    </button>
  );
};
