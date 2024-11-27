import { FunctionalComponent } from '@synxjs/types';
import { usePulseState } from '@synxjs/hooks';
import { store } from '../store';

export const UserSettings: FunctionalComponent = () => {
  const [user, setUser] = usePulseState('user', store);
  const [theme, setTheme] = usePulseState('theme', store);

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded shadow">
      <h2 className="text-xl font-bold">Settings</h2>

      <div className="space-y-2">
        <label className="block">
          Name:
          <input
            type="text"
            value={user.name}
            onChange={(e: InputEvent) =>
              setUser({ ...user, name: (e.target as HTMLInputElement).value })
            }
            className="ml-2 px-2 py-1 border rounded"
          />
        </label>

        <label className="block">
          Show Completed:
          <input
            type="checkbox"
            checked={user.preferences.showCompleted}
            onChange={(e: InputEvent) =>
              setUser({
                ...user,
                preferences: {
                  ...user.preferences,
                  showCompleted: (e.target as HTMLInputElement).checked,
                },
              })
            }
            className="ml-2"
          />
        </label>

        <label className="block">
          Sort By:
          <select
            value={user.preferences.sortBy}
            onChange={(e: InputEvent) =>
              setUser({
                ...user,
                preferences: {
                  ...user.preferences,
                  sortBy: (e.target as HTMLSelectElement).value as
                    | 'date'
                    | 'name',
                },
              })
            }
            className="ml-2 px-2 py-1 border rounded"
          >
            <option value="date">Date</option>
            <option value="name">Name</option>
          </select>
        </label>

        <label className="block">
          Theme:
          <select
            value={theme}
            onChange={(e: InputEvent) =>
              setTheme(
                (e.target as HTMLSelectElement).value as 'light' | 'dark',
              )
            }
            className="ml-2 px-2 py-1 border rounded"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </div>
    </div>
  );
};
