import { authGuard } from './guards/auth';
import { adminGuard } from './guards/admin';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { Route } from '@synxjs/types';

export const routes: Route[] = [
  {
    path: '/',
    component: () => import('./pages/Home').then((m) => m.Home),
    lazy: true,
    loading: LoadingSpinner,
  },
  {
    path: '/login',
    component: () => import('./pages/Login').then((m) => m.Login),
    lazy: true,
    transition: {
      enter: 'slide-in',
      leave: 'slide-out',
      duration: 300,
    },
  },
  {
    path: '/admin',
    component: () => import('./pages/Admin/Layout').then((m) => m.AdminLayout),
    lazy: true,
    guards: [authGuard, adminGuard],
    loading: LoadingSpinner,
    error: ErrorBoundary,
    children: [
      {
        lazy: true,
        path: '/admin',
        component: () => import('./pages/Admin').then((m) => m.AdminOverview),
      },
      {
        lazy: true,
        path: '/admin/dashboard',
        component: () =>
          import('./pages/Admin/Dashboard').then((m) => m.AdminDashboard),
      },
    ],
  },
  {
    path: '/products',
    component: () => import('./pages/Products').then((m) => m.Products),
    lazy: true,
    guards: [authGuard],
    transition: {
      enter: 'fade-in',
      leave: 'fade-out',
      duration: 300,
    },
  },
  {
    path: '/products/:id',
    component: () =>
      import('./pages/Products/[id]').then((m) => m.ProductDetail),
    lazy: true,
    guards: [authGuard],
    transition: {
      enter: 'slide-left fade-in',
      leave: 'slide-right fade-out',
      duration: 300,
    },
  },
  {
    path: '/users',
    component: () => import('./pages/Users/Layout').then((m) => m.UsersLayout),
    guards: [authGuard],
    lazy: true,
    children: [
      {
        path: '/users',
        lazy: true,
        component: () => import('./pages/Users').then((m) => m.Users),
      },
      {
        path: '/users/:id',
        lazy: true,
        component: () =>
          import('./pages/Users/[id]').then((m) => m.UserProfile),
      },
      {
        path: '/users/:id/posts',
        lazy: true,
        component: () =>
          import('./pages/Users/[id]/posts').then((m) => m.UserPosts),
      },
    ],
  },
];
