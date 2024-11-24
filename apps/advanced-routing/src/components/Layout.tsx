import { FunctionalComponent, VNodeChildren } from '@synxjs/types';
import { Navigation } from './Navigation';

interface LayoutProps {
  children: VNodeChildren;
}

export const Layout: FunctionalComponent<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};