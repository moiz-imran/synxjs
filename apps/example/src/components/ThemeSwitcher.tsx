import { usePulseEffect, usePulseState } from '@synxjs/hooks';
import { FunctionalComponent } from '@synxjs/types';
import { appStore } from '../store';
import { Button } from './Button';

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

  usePulseEffect(() => applyTheme(theme));

  return (
    <Button
      label={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    />
  );
};
