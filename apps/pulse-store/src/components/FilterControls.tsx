import { FunctionalComponent } from '@synxjs/types';
import { usePulseState } from '@synxjs/hooks';
import { store } from '../store';

export const FilterControls: FunctionalComponent = () => {
  const [filter, setFilter] = usePulseState('filter', store);
  const [todos] = usePulseState('todos', store);

  const counts = {
    all: todos.length,
    active: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
  };

  return (
    <div className="flex space-x-4">
      {(['all', 'active', 'completed'] as const).map((f) => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          className={`px-4 py-2 rounded ${
            filter === f ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
        </button>
      ))}
    </div>
  );
};
