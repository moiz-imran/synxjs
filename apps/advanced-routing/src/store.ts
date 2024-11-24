import { PulseStore } from '@synxjs/store';

interface AuthState extends Record<string, unknown> {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: {
    id: string;
    name: string;
    role: 'user' | 'admin';
  } | null;
}

export const authStore = new PulseStore<AuthState>({
  isAuthenticated: false,
  isAdmin: false,
  user: null,
});