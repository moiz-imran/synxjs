import { PulseStore } from '@synxjs/store';
import {
  createLoggerMiddleware,
  createPersistenceMiddleware,
} from '@synxjs/store/middleware';

interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

interface AppState extends Record<string, unknown> {
  todos: TodoItem[];
  filter: 'all' | 'active' | 'completed';
  theme: 'light' | 'dark';
  user: {
    name: string;
    preferences: {
      showCompleted: boolean;
      sortBy: 'date' | 'name';
    };
  };
}

const initialState: AppState = {
  todos: [],
  filter: 'all',
  theme: 'light',
  user: {
    name: 'Guest',
    preferences: {
      showCompleted: true,
      sortBy: 'date',
    },
  },
};

// Create store with middleware
export const store = new PulseStore<AppState>(initialState, [
  createLoggerMiddleware<AppState>(),
  createPersistenceMiddleware<AppState>({
    key: 'store-features-state',
  }),
]);
