import { FunctionalComponent } from '@synxjs/types';
import { useParams, Link } from '@synxjs/router';

interface UserPostsParams extends Record<string, string> {
  id: string;
}

interface Post {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  likes: number;
}

const USER_POSTS: Record<string, Post[]> = {
  '1': [
    {
      id: '1',
      title: 'Getting Started with SynxJS',
      excerpt: 'Learn how to build modern web applications with SynxJS...',
      date: '2024-01-15',
      likes: 42,
    },
    {
      id: '2',
      title: 'Advanced Routing Patterns',
      excerpt: 'Explore advanced routing techniques and best practices...',
      date: '2024-01-10',
      likes: 38,
    },
    {
      id: '3',
      title: 'State Management Deep Dive',
      excerpt: 'Understanding state management in modern applications...',
      date: '2024-01-05',
      likes: 35,
    },
  ],
  '2': [
    {
      id: '1',
      title: 'UX Design Principles',
      excerpt: 'Essential principles for creating great user experiences...',
      date: '2024-01-12',
      likes: 28,
    },
    {
      id: '2',
      title: 'Design Systems at Scale',
      excerpt:
        'Building and maintaining design systems for large applications...',
      date: '2024-01-08',
      likes: 31,
    },
  ],
};

export const UserPosts: FunctionalComponent = () => {
  const { id } = useParams<UserPostsParams>();
  const posts = USER_POSTS[id] || [];

  return (
    <div>
      <div className="mb-6">
        <Link to={`/users/${id}`} className="text-blue-500 hover:underline">
          ← Back to Profile
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">User Posts</h1>

      <div className="space-y-6">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2">{post.title}</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {post.excerpt}
              </p>
              <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <span>{post.date}</span>
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-500 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {post.likes} likes
                </div>
              </div>
            </div>
          </article>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">No posts found</p>
          </div>
        )}
      </div>
    </div>
  );
};
