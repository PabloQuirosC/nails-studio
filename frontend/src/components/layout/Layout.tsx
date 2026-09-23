import { Outlet } from 'react-router';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Chatbot } from '../chatbot/Chatbot';

export function Layout() {
  return (
    <div className="min-h-screen bg-[#0d0b09] text-[#faf7f0]">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
}
