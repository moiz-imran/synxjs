import { FunctionalComponent } from '@synxjs/types';
import { RouterProvider, Router } from '@synxjs/router';
import { routes } from 'virtual:generated-routes';
import Layout from './pages/_layout';

const router = new Router(routes);

export const App: FunctionalComponent = () => {
  return (
    <RouterProvider
      router={router}
      renderer={(Routes) => (
        <Layout>
          <Routes />
        </Layout>
      )}
    />
  );
};
