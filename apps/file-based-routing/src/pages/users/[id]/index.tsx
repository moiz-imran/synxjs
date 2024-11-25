import { FunctionalComponent } from '@synxjs/types';
import { useParams, Link } from '@synxjs/router';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  joinDate: string;
  bio: string;
  location: string;
  postCount: number;
  stats: {
    followers: number;
    following: number;
    likes: number;
  };
}

const USERS: Record<string, User> = {
  '1': {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    joinDate: '2023-01-15',
    bio: 'Senior software engineer with a passion for clean code and innovative solutions.',
    location: 'San Francisco, CA',
    postCount: 15,
    stats: {
      followers: 1234,
      following: 567,
      likes: 8901,
    },
  },
  '2': {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    joinDate: '2023-03-22',
    bio: 'UX designer focused on creating delightful user experiences.',
    location: 'New York, NY',
    postCount: 8,
    stats: {
      followers: 892,
      following: 345,
      likes: 4567,
    },
  },
  '3': {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'User',
    joinDate: '2023-06-10',
    bio: 'Product manager with 5+ years of experience in tech.',
    location: 'Austin, TX',
    postCount: 12,
    stats: {
      followers: 567,
      following: 234,
      likes: 3456,
    },
  },
};

const UserProfile: FunctionalComponent = () => {
  const { id } = useParams<{ id: string }>();
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="col-span-2">
              <h2 className="text-xl font-semibold mb-4">Profile</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Bio
                  </dt>
                  <dd className="mt-1 text-gray-900 dark:text-gray-100">
                    {user.bio}
                  </dd>
                </div>
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
                    Joined
                  </dt>
                  <dd className="mt-1 text-gray-900 dark:text-gray-100">
                    {user.joinDate}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Stats</h2>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <dl className="grid grid-cols-1 gap-4">
                  <div className="text-center">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Posts
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {user.postCount}
                    </dd>
                  </div>
                  <div className="text-center">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Followers
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {user.stats.followers}
                    </dd>
                  </div>
                  <div className="text-center">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Following
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {user.stats.following}
                    </dd>
                  </div>
                  <div className="text-center">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Likes
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {user.stats.likes}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6">
                <Link
                  to={`/users/${user.id}/posts`}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  View Posts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
