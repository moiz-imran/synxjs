import { FunctionalComponent } from '@synxjs/types';
import { usePulseEffect } from '@synxjs/hooks';
import { TodoList } from './components/TodoList';
import { FilterControls } from './components/FilterControls';
import { UserSettings } from './components/UserSettings';
import { StoreDebugger } from './components/StoreDebugger';
import { store } from './store';

export const App: FunctionalComponent = () => {
  // Apply theme changes
  usePulseEffect(() => {
    const theme = store.getPulse('theme');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  });

  return (
    <div className="min-h-screen p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold">Store Features Demo</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Showcasing PulseStore capabilities
          </p>
        </header>

        <main className="space-y-8">
          <UserSettings />
          <FilterControls />
          <TodoList />
        </main>

        <StoreDebugger />
      </div>
    </div>
  );
};
