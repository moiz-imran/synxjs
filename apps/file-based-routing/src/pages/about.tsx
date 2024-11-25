import { FunctionalComponent } from '@synxjs/types';

const About: FunctionalComponent = () => {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>About File-Based Routing</h1>
      <p>
        File-based routing is a routing approach where the route structure is
        determined by the file system structure. This approach is popularized by
        frameworks like Next.js and provides several benefits:
      </p>

      <h2>Benefits</h2>
      <ul>
        <li>Intuitive route organization</li>
        <li>Reduced configuration</li>
        <li>Clear project structure</li>
        <li>Easy to understand routing patterns</li>
      </ul>

      <h2>How It Works</h2>
      <p>
        The router scans the <code>pages</code> directory and creates routes
        based on the file structure:
      </p>

      <ul>
        <li>
          <code>pages/index.tsx</code> becomes <code>/</code>
        </li>
        <li>
          <code>pages/about.tsx</code> becomes <code>/about</code>
        </li>
        <li>
          <code>pages/blog/[slug].tsx</code> becomes <code>/blog/:slug</code>
        </li>
        <li>
          <code>pages/users/[id]/posts.tsx</code> becomes{' '}
          <code>/users/:id/posts</code>
        </li>
      </ul>

      <h2>Special Files</h2>
      <ul>
        <li>
          <code>_layout.tsx</code> - Shared layout component
        </li>
        <li>
          <code>_error.tsx</code> - Error page component
        </li>
        <li>
          <code>_loading.tsx</code> - Loading state component
        </li>
      </ul>
    </div>
  );
};

export default About;
