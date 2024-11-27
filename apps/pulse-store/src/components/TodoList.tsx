import { FunctionalComponent } from '@synxjs/types';
import { usePulseState } from '@synxjs/hooks';
import { store } from '../store';

export const TodoList: FunctionalComponent = () => {
  const [todos, setTodos] = usePulseState('todos', store);
  const [filter] = usePulseState('filter', store);
  const [user] = usePulseState('user', store);

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const addTodo = (text: string) => {
    setTodos([...todos, { id: Date.now(), text, completed: false }]);
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{user.name}'s Todos</h2>
        <span className="text-sm text-gray-500">
          Sorting by: {user.preferences.sortBy}
        </span>
      </div>

      <form
        onSubmit={(e: SubmitEvent) => {
          e.preventDefault();
          const form = e.currentTarget as HTMLFormElement;
          const input = form.elements.namedItem('todo') as HTMLInputElement;
          if (input.value.trim()) {
            addTodo(input.value.trim());
            input.value = '';
          }
        }}
      >
        <input
          type="text"
          name="todo"
          className="w-full px-4 py-2 border rounded"
          placeholder="Add new todo..."
        />
      </form>

      <ul className="space-y-2">
        {filteredTodos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center space-x-2 p-2 bg-white rounded shadow"
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span
              className={todo.completed ? 'line-through text-gray-500' : ''}
            >
              {todo.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
