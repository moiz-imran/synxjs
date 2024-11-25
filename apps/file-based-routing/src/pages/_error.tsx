import { FunctionalComponent } from '@synxjs/types';
import { Link } from '@synxjs/router';

const ErrorPage: FunctionalComponent = () => {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Something went wrong loading this page.
        </p>
        <Link to="/" className="text-blue-500 hover:text-blue-600 underline">
          Go back home
        </Link>
      </div>
    </div>
  );
};

export default ErrorPage;
