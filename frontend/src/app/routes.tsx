import { createBrowserRouter } from 'react-router';
import { Layout } from '../components/layout/Layout';
import { Home } from '../pages/Home';
import { Catalog } from '../pages/Catalog';
import { DesignDetail } from '../pages/Catalog/Detail';
import { Booking } from '../pages/Booking';
import { Gallery } from '../pages/Gallery';
import { Blog } from '../pages/Blog';
import { BlogPost } from '../pages/Blog/Post';
import { About } from '../pages/About';
import { Contact } from '../pages/Contact';
import { Referrals } from '../pages/Referrals';
import { AdminLogin } from '../pages/Admin/Login';
import { AdminDashboard } from '../pages/Admin/Dashboard';
import { ProtectedRoute } from '../shared/auth/guards';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'catalogo', Component: Catalog },
      { path: 'catalogo/:id', Component: DesignDetail },
      { path: 'reservas', Component: Booking },
      { path: 'galeria', Component: Gallery },
      { path: 'blog', Component: Blog },
      { path: 'blog/:id', Component: BlogPost },
      { path: 'nosotros', Component: About },
      { path: 'contacto', Component: Contact },
      { path: 'referidos', Component: Referrals },
    ],
  },
  { path: '/admin', Component: AdminLogin },
  {
    path: '/admin/dashboard',
    element: (
      <ProtectedRoute>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
]);
