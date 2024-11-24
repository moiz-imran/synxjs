import { Link } from '@synxjs/router';
import { VNodeChildren, FunctionalComponent } from '@synxjs/types';

interface AdminLayoutProps {
  children: VNodeChildren;
}

export const AdminLayout: FunctionalComponent<AdminLayoutProps> = ({
  children,
}) => {
  return (
    <div className="flex">
      <aside className="w-64 bg-gray-800 min-h-screen p-4">
        <nav className="space-y-2">
          <Link to="/admin" className="block text-gray-300 hover:text-white">
            Overview
          </Link>
          <Link
            to="/admin/dashboard"
            className="block text-gray-300 hover:text-white"
          >
            Dashboard
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};
