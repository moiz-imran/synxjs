import { FunctionalComponent, VNode } from '@synxjs/types';
import { Link } from '@synxjs/router';

interface UsersLayoutProps {
  children: VNode;
}

export const UsersLayout: FunctionalComponent<UsersLayoutProps> = ({
  children,
}) => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Users Navigation</h2>
          <nav className="space-y-2">
            <Link
              to="/users"
              className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              All Users
            </Link>
            {/* Example user links - in real app, these might be dynamic */}
            <Link
              to="/users/1"
              className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              User 1
            </Link>
            <Link
              to="/users/2"
              className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              User 2
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};
