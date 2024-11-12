import { PulseStore } from '@synxjs/store';

/**
 * Define the shape of your global state
 */
export interface AppState extends Record<string, unknown> {
  count: number;
  alertVisible: boolean;
  theme: 'light' | 'dark';
}

export interface UserState extends Record<string, unknown> {
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
