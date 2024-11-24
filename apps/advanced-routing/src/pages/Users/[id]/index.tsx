import { FunctionalComponent } from '@synxjs/types';
import { useParams, Link } from '@synxjs/router';

interface UserParams extends Record<string, string> {
  id: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  joinDate: string;
  bio: string;
  location: string;
  postCount: number;
}

const USERS: Record<string, User> = {
  '1': {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    joinDate: '2023-01-15',
    bio: 'Senior software engineer with a passion for clean code',
    location: 'San Francisco, CA',
    postCount: 15,
  },
  '2': {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    joinDate: '2023-03-22',
    bio: 'UX designer focused on creating delightful user experiences',
    location: 'New York, NY',
    postCount: 8,
  },
};

export const UserProfile: FunctionalComponent = () => {
  const { id } = useParams<UserParams>();
  const user = USERS[id];

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600 mb-4">User Not Found</h2>
        <Link to="/users" className="text-blue-500 hover:underline">
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/users" className="text-blue-500 hover:underline">
          ← Back to Users
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
              <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                user.role === 'Admin'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {user.role}
            </span>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Profile Information
              </h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Location
                  </dt>
                  <dd className="mt-1 text-gray-900 dark:text-gray-100">
                    {user.location}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Join Date
                  </dt>
                  <dd className="mt-1 text-gray-900 dark:text-gray-100">
                    {user.joinDate}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Bio
                  </dt>
                  <dd className="mt-1 text-gray-900 dark:text-gray-100">
                    {user.bio}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Activity</h2>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {user.postCount}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    Total Posts
                  </p>
                </div>
                <div className="mt-4 text-center">
                  <Link
                    to={`/users/${user.id}/posts`}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    View All Posts
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
