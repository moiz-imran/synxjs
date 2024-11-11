import { Counter } from './Counter';
import { UserProfile } from './UserProfile';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Alert } from './Alert';
import type { FunctionalComponent } from 'core/types';

export const App: FunctionalComponent = () => {
  return (
    <div className="min-h-screen p-8 dark:bg-gray-900 dark:text-white bg-gray-100 text-gray-900">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">NovaUI App</h1>
        {/* Assign a unique key to ThemeSwitcher */}
        <ThemeSwitcher />
      </header>

      <main className="space-y-6">
        <UserProfile />
        <Counter />
        <Alert message="This is a success alert!" type="success" dismissible />
      </main>

      <footer className="py-2 text-center absolute bottom-0 w-full bg-black -mx-8 text-white">
        © 2024 NovaUI. All rights reserved.
      </footer>
    </div>
  );
};
