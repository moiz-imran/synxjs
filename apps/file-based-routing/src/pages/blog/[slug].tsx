import { FunctionalComponent } from '@synxjs/types';
import { useParams, Link } from '@synxjs/router';

interface BlogPost {
  slug: string;
  title: string;
  content: string;
  date: string;
  author: {
    name: string;
    avatar: string;
  };
}

const BLOG_POSTS: Record<string, BlogPost> = {
  'getting-started': {
    slug: 'getting-started',
    title: 'Getting Started with File-Based Routing',
    content: `
      File-based routing is a powerful feature that simplifies route management in your application.
      Instead of manually configuring routes, the routing structure is automatically generated based
      on your file system structure.

      ## How It Works

      The router scans your \`pages\` directory and creates routes based on the file names:

      - \`pages/index.tsx\` → \`/\`
      - \`pages/about.tsx\` → \`/about\`
      - \`pages/blog/[slug].tsx\` → \`/blog/:slug\`

      ## Benefits

      1. **Intuitive Organization**: Your file structure mirrors your route structure
      2. **Reduced Configuration**: No need for manual route configuration
      3. **Easy to Understand**: Clear relationship between files and URLs
      4. **Maintainable**: Easy to add, remove, or modify routes
    `,
    date: '2024-01-15',
    author: {
      name: 'John Doe',
      avatar: '1',
    },
  },
  'dynamic-routes': {
    slug: 'dynamic-routes',
    title: 'Understanding Dynamic Routes',
    content: `
      Dynamic routes allow you to create pages that can match different URLs based on parameters.
      This is perfect for content that follows a consistent pattern but has variable data.

      ## Creating Dynamic Routes

      To create a dynamic route, wrap the variable part of the filename in square brackets:

      - \`pages/blog/[slug].tsx\` → Matches \`/blog/any-slug\`
      - \`pages/users/[id]/posts.tsx\` → Matches \`/users/123/posts\`

      ## Accessing Parameters

      Use the \`useParams\` hook to access route parameters in your component:

      \`\`\`typescript
      const { slug } = useParams<{ slug: string }>();
      \`\`\`

      ## Use Cases

      - Blog posts
      - User profiles
      - Product pages
      - Documentation sections
    `,
    date: '2024-01-10',
    author: {
      name: 'Jane Smith',
      avatar: '2',
    },
  },
  'nested-routes': {
    slug: 'nested-routes',
    title: 'Working with Nested Routes',
    content: `
      Nested routes allow you to create complex page hierarchies while maintaining
      a clean and organized file structure.

      ## Creating Nested Routes

      Simply create folders in your \`pages\` directory:

      \`\`\`
      pages/
      ├── users/
      │   ├── index.tsx
      │   └── [id]/
      │       ├── index.tsx
      │       └── posts.tsx
      \`\`\`

      ## Shared Layouts

      Use \`_layout.tsx\` files to create shared layouts for nested routes:

      - Common navigation
      - Sidebar content
      - Context providers
      - Error boundaries
    `,
    date: '2024-01-05',
    author: {
      name: 'Bob Johnson',
      avatar: '3',
    },
  },
};

const BlogPost: FunctionalComponent = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = BLOG_POSTS[slug];

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Post Not Found</h2>
        <Link to="/blog" className="text-blue-500 hover:underline">
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto">
      <Link
        to="/blog"
        className="text-blue-500 hover:underline mb-8 inline-block"
      >
        ← Back to Blog
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

          <div className="flex items-center mb-8 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-2">
                {post.author.avatar}
              </div>
              <span>{post.author.name}</span>
            </div>
            <span className="mx-2">•</span>
            <span>{post.date}</span>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            {post.content.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
};

export default BlogPost;
