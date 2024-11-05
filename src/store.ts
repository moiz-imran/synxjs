// src/store.ts

import { reactive } from './core/reactive';

/**
 * Define the shape of your global state
 */
export interface AppState {
  count: number;
  userName: string;
  alertVisible: boolean;
  theme: 'light' | 'dark';
  // Add more state properties as needed
}

/**
 * Initialize the ReactiveStore with default values
 */
export const store = reactive<AppState>({
  count: 0,
  userName: 'Guest',
  alertVisible: false,
  theme: 'dark'
});
