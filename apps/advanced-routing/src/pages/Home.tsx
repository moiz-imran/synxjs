import { FunctionalComponent } from '@synxjs/types';

export const Home: FunctionalComponent = () => {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1 className="text-3xl">Welcome to Advanced Routing Example</h1>
      <p className="opacity-70">This example demonstrates advanced routing features:</p>
      <ul className="list-decimal pl-9 mt-4">
        <li>Authentication & Authorization Guards</li>
        <li>Route Transitions</li>
        <li>Nested Layouts</li>
        <li>Dynamic Routes</li>
        <li>Lazy Loading</li>
      </ul>
    </div>
  );
};
