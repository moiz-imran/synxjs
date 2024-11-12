import { Counter } from './Counter';
import { UserProfile } from './UserProfile';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Alert } from './Alert';
import type { FunctionalComponent } from '@synxjs/types';

export const App: FunctionalComponent = () => {
  return (
    <div className="min-h-screen p-8 dark:bg-gray-900 dark:text-white bg-gray-100 text-gray-900">
      <header role="banner" className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">SynxJS App</h1>
        <ThemeSwitcher key="theme-switcher" />
      </header>

      <main role="main" className="space-y-6">
        <UserProfile />
        <Counter />
        <Alert message="This is a success alert!" type="success" dismissible />
      </main>

      <footer role="contentinfo" className="py-2 text-center absolute bottom-0 w-full bg-black -mx-8 text-white">
        © 2024 SynxJS. All rights reserved.
      </footer>
    </div>
  );
};
