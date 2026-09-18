import { RouterProvider } from 'react-router';
import { router } from './app/routes';
import { GlobalNailsLoader } from './shared/loading/GlobalNailsLoader';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <GlobalNailsLoader />
    </>
  );
}
