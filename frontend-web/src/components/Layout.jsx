import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>
      <Navbar onToggle={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex pt-16">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-white border-r border-gray-200 shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
          <Sidebar onClose={() => {}} />
        </aside>

        {/* Sidebar Mobile */}
        <aside
          className={`fixed top-16 bottom-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:hidden ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </aside>

        {/* Konten utama */}
        <main id="main-content" className="flex-1 min-h-[calc(100vh-4rem)]">
          <div className="mx-auto w-full max-w-[1500px] p-4 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}