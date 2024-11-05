// src/store.ts

import { PulseStore } from './core/store';

/**
 * Define the shape of your global state
 */
export interface AppState {
  count: number;
  alertVisible: boolean;
  theme: 'light' | 'dark';
}

export interface UserState {
  userName: string;
}

/**
 * Initialize the PulseStore with default values
 */
export const appStore = new PulseStore<AppState>({
  count: 0,
  alertVisible: false,
  theme: 'dark',
});

export const userStore = new PulseStore<UserState>({
  userName: 'Guest',
});
