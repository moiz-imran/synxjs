import { usePulseState } from '@synxjs/hooks';
import { authStore } from '../../store';
import { FunctionalComponent } from '@synxjs/types';

export const AdminOverview: FunctionalComponent = () => {
  const [user] = usePulseState('user', authStore);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Overview</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Welcome, {user?.name}</h2>
        <p>This is a protected admin area.</p>
      </div>
    </div>
  );
};
