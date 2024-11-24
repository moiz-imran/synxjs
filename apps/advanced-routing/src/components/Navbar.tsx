import { FunctionalComponent } from '@synxjs/types';
import { Link } from '@synxjs/router';
import { usePulseState } from '@synxjs/hooks';
import { authStore } from '../store';
import { Fragment } from '@synxjs/vdom';

export const Navbar: FunctionalComponent = () => {
  const [isAuthenticated] = usePulseState('isAuthenticated', authStore);
  const [isAdmin] = usePulseState('isAdmin', authStore);

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Left side - Brand and primary navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link
                to="/"
                className="text-xl font-bold text-gray-800 dark:text-white"
              >
                Advanced Router
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="inline-flex items-center px-1 pt-1 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Home
              </Link>
              {isAuthenticated && (
                <Fragment>
                  <Link
                    to="/products"
                    className="inline-flex items-center px-1 pt-1 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    Products
                  </Link>
                  <Link
                    to="/users"
                    className="inline-flex items-center px-1 pt-1 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    Users
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="inline-flex items-center px-1 pt-1 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    >
                      Admin
                    </Link>
                  )}
                </Fragment>
              )}
            </div>
          </div>

          {/* Right side - Auth buttons */}
          <div className="flex items-center">
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Login
              </Link>
            ) : (
              <button
                onClick={() => {
                  authStore.setPulse('state', {
                    isAuthenticated: false,
                    isAdmin: false,
                    user: null,
                  });
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
