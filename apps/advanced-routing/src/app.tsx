import { FunctionalComponent } from '@synxjs/types';
import { RouterProvider } from '@synxjs/router';
import { routes } from './routes';
import { Router } from '@synxjs/router';
import { loggerMiddleware } from './middleware/logger';
import { Navbar } from './components/Navbar';

// Create router instance with global middleware
const router = new Router(routes, {
  middleware: [loggerMiddleware],
});

export const App: FunctionalComponent = () => {
  return (
    <RouterProvider
      router={router}
      renderer={(Routes) => (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
          <Navbar />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <Routes />
          </main>
        </div>
      )}
    />
  );
};
