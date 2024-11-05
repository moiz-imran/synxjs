// src/components/App.tsx

import { FunctionalComponent } from '../core/vdom';
import { useStore } from '../core/hooks';
import { Counter } from './Counter';
import { UserProfile } from './UserProfile';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Alert } from './Alert';
import { Button } from './Button';

export const App: FunctionalComponent = () => {
  const [theme] = useStore('theme');
  const [, setAlertVisible] = useStore('alertVisible');

  return (
    <div
      className={`min-h-screen p-8 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}
    >
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">NovaUI App</h1>
        {/* Assign a unique key to ThemeSwitcher */}
        <ThemeSwitcher />
      </header>

      <main className="space-y-6">
        <UserProfile />
        <Counter />
        <Button
          label="Show Alert"
          onClick={() => setAlertVisible(true)}
        >
          Show Alert
        </Button>
        <Alert message="This is a success alert!" type="success" dismissible />
      </main>

      <footer className="py-2 text-center absolute bottom-0 w-full bg-black -mx-8 text-white">
        © 2024 NovaUI. All rights reserved.
      </footer>
    </div>
  );
};
