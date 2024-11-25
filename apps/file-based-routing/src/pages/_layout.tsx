import { FunctionalComponent, VNode, VNodeChildren } from '@synxjs/types';
import { Link } from '@synxjs/router';

interface LayoutProps {
  children?: VNodeChildren | VNode;
}

const Layout: FunctionalComponent<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-xl font-bold">
                  File Router
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className="inline-flex items-center px-1 pt-1 text-gray-500 dark:text-gray-300 hover:text-gray-900"
                >
                  Home
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center px-1 pt-1 text-gray-500 dark:text-gray-300 hover:text-gray-900"
                >
                  About
                </Link>
                <Link
                  to="/blog"
                  className="inline-flex items-center px-1 pt-1 text-gray-500 dark:text-gray-300 hover:text-gray-900"
                >
                  Blog
                </Link>
                <Link
                  to="/users"
                  className="inline-flex items-center px-1 pt-1 text-gray-500 dark:text-gray-300 hover:text-gray-900"
                >
                  Users
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</div>
      </main>

      <footer className="bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 dark:text-gray-400">
            © 2024 File-Based Router Example
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
