import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>
      <Navbar onToggle={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex pt-16">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex lg:w-64 3xl:w-80 lg:flex-col bg-card border-r border-border shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
          <Sidebar onClose={() => {}} />
        </aside>

        {/* Sidebar Mobile */}
        <aside
          className={`fixed top-16 bottom-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 lg:hidden ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </aside>

        {/* Konten utama */}
        <main id="main-content" className="min-w-0 flex-1 min-h-[calc(100vh-4rem)]">
          <div className="mx-auto w-full max-w-[1920px] 3xl:max-w-[2560px] 4xl:max-w-[3400px] p-4 sm:p-6 lg:p-8 2xl:p-10 3xl:p-12">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-foreground/40 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}