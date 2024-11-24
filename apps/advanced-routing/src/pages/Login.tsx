import { authStore } from '../store';
import { useRouter } from '@synxjs/router';
import { FunctionalComponent } from '@synxjs/types';

export const Login: FunctionalComponent = () => {
  const router = useRouter();

  const handleLogin = (role: 'user' | 'admin') => {
    authStore.setPulses({
      isAuthenticated: true,
      isAdmin: role === 'admin',
      user: {
        id: '1',
        name: role === 'admin' ? 'Admin User' : 'Regular User',
        role,
      },
    });
    router.navigate('/');
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <div className="space-y-4">
        <button
          onClick={() => handleLogin('user')}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Login as User
        </button>
        <button
          onClick={() => handleLogin('admin')}
          className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Login as Admin
        </button>
      </div>
    </div>
  );
};
