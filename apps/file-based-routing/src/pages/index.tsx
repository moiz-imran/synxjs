import { FunctionalComponent } from '@synxjs/types';
import { Link } from '@synxjs/router';

const Home: FunctionalComponent = () => {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>File-Based Routing</h1>
      <p>
        This example demonstrates file-based routing in SynxJS. The routes are
        automatically generated based on the file structure in the{' '}
        <code>pages</code> directory.
      </p>

      <h2>Directory Structure</h2>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-gray-800 dark:text-gray-200">
        {`pages/
├── index.tsx         -> /
├── about.tsx        -> /about
├── blog/
│   ├── index.tsx    -> /blog
│   └── [slug].tsx   -> /blog/:slug
└── users/
    ├── index.tsx    -> /users
    └── [id]/
        ├── index.tsx -> /users/:id
        └── posts.tsx -> /users/:id/posts`}
      </pre>

      <h2>Features</h2>
      <ul>
        <li>Automatic route generation</li>
        <li>Dynamic routes with parameters</li>
        <li>Nested routes</li>
        <li>Shared layouts</li>
        <li>Loading states</li>
        <li>Error handling</li>
      </ul>

      <div className="flex gap-4 mt-8">
        <Link
          to="/blog"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          View Blog
        </Link>
        <Link
          to="/users"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          View Users
        </Link>
      </div>
    </div>
  );
};

export default Home;
