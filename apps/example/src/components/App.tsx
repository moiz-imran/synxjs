import { Counter } from './Counter';
import { UserProfile } from './UserProfile';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Alert } from './Alert';
import type { FunctionalComponent } from '@synxjs/types';
import { Link, Router, RouterProvider } from '@synxjs/router';

const routes = [
  {
    path: '/',
    component: Counter,
  },
  {
    path: '/user',
    component: UserProfile,
    children: [
      {
        path: '/user/:id',
        component: UserProfile,
      },
    ],
  },
  {
    path: '/alert',
    component: () => (
      <Alert message="This is a success alert!" type="success" dismissible />
    ),
  },
];

const router = new Router(routes);

export const App: FunctionalComponent = () => {
  return (
    <RouterProvider
      router={router}
      renderer={(Routes) => (
        <div className="min-h-screen p-8 dark:bg-gray-900 dark:text-white bg-gray-100 text-gray-900">
          <header
            role="banner"
            className="flex justify-between items-center mb-8"
          >
            <h1 className="text-4xl font-bold">SynxJS App</h1>
            <ThemeSwitcher key="theme-switcher" />
          </header>

          <nav className="flex gap-4 mb-8 underline">
            <Link to="/">Counter</Link>
            <Link to="/user">User Profile</Link>
            <Link to="/alert">Alert</Link>
            <Link to="/not-found">Not Found</Link>
          </nav>

          <main role="main" className="space-y-6">
            <Routes />
          </main>

          <footer
            role="contentinfo"
            className="py-2 text-center absolute bottom-0 w-full bg-black -mx-8 text-white"
          >
            © 2024 SynxJS. All rights reserved.
          </footer>
        </div>
      )}
    />
  );
};
