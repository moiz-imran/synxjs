import { Link } from '@synxjs/router';
import { usePulseState } from '@synxjs/hooks';
import { authStore } from '../store';

export const Navigation = () => {
  const [isAuthenticated] = usePulseState('isAuthenticated', authStore);

  const [isAdmin] = usePulseState('isAdmin', authStore);

  return (
    <nav className="bg-white dark:bg-gray-800 shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex space-x-4 items-center">
            <Link
              to="/"
              className="text-gray-700 dark:text-gray-200 hover:text-blue-500"
            >
              Home
            </Link>
            <Link
              to="/products"
              className="text-gray-700 dark:text-gray-200 hover:text-blue-500"
            >
              Products
            </Link>
            <Link
              to="/users"
              className="text-gray-700 dark:text-gray-200 hover:text-blue-500"
            >
              Users
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="text-gray-700 dark:text-gray-200 hover:text-blue-500"
              >
                Admin
              </Link>
            )}
          </div>
          <div className="flex items-center">
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Login
              </Link>
            ) : (
              <button
                onClick={() =>
                  authStore.setPulse('state', {
                    isAuthenticated: false,
                    isAdmin: false,
                    user: null,
                  })
                }
                className="bg-red-500 text-white px-4 py-2 rounded"
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
