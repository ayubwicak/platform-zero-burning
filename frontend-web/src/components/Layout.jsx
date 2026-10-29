import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('admin-mode');
    return () => {
      document.documentElement.classList.remove('admin-mode');
    };
  }, []);

  return (
    <div className="admin-layout min-h-screen bg-background text-foreground font-sans">
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>
      <Navbar onToggle={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex pt-[var(--header-h,4rem)]">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex w-[var(--sidebar-w,16rem)] 3xl:w-[var(--sidebar-w-wide,20rem)] lg:flex-col bg-card border-r border-border shrink-0 sticky top-[var(--header-h,4rem)] h-[calc(100vh-var(--header-h,4rem))]">
          <Sidebar onClose={() => {}} />
        </aside>

        {/* Sidebar Mobile */}
        <aside
          className={`fixed top-[var(--header-h,4rem)] bottom-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 lg:hidden ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </aside>

        {/* Konten utama */}
        <main id="main-content" className="min-w-0 flex-1 min-h-[calc(100vh-var(--header-h,4rem))]">
          <div className="mx-auto w-full max-w-[1536px] 3xl:max-w-[1920px] p-4 sm:p-5 lg:p-6 2xl:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 top-[var(--header-h,4rem)] z-40 bg-foreground/40 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}