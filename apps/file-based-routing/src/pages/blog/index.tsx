import { FunctionalComponent } from '@synxjs/types';
import { Link } from '@synxjs/router';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
}

const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'getting-started',
    title: 'Getting Started with File-Based Routing',
    excerpt:
      'Learn how to use file-based routing in your SynxJS applications...',
    date: '2024-01-15',
  },
  {
    slug: 'dynamic-routes',
    title: 'Understanding Dynamic Routes',
    excerpt: 'Explore how to create dynamic routes using file names...',
    date: '2024-01-10',
  },
  {
    slug: 'nested-routes',
    title: 'Working with Nested Routes',
    excerpt: 'Deep dive into nested routing patterns and best practices...',
    date: '2024-01-05',
  },
];

const Blog: FunctionalComponent = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Blog Posts</h1>
      <div className="space-y-8">
        {BLOG_POSTS.map((post) => (
          <article
            key={post.slug}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
          >
            <div className="p-6">
              <Link
                to={`/blog/${post.slug}`}
                className="text-xl font-bold mb-2 hover:text-blue-500 block"
              >
                {post.title}
              </Link>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {post.excerpt}
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {post.date}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Blog;
