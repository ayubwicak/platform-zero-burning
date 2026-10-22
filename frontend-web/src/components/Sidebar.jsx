import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const roleLabels = {
  petani: 'Petani',
  petugas: 'Petugas Lapangan',
  admin: 'Administrator',
};

const items = [
  { name: 'Dashboard', icon: 'dashboard', path: '/dashboard', roles: ['petani', 'petugas', 'admin'] },
  { name: 'Lahan Saya', icon: 'layout', path: '/fields', roles: ['petani'] },
  { name: 'Unggah Foto', icon: 'image', path: '/upload', roles: ['petani'] },
  { name: 'Verifikasi', icon: 'shield', path: '/verifikasi', roles: ['petugas', 'admin'] },
  { name: 'Insentif', icon: 'credit-card', path: '/klaim', roles: ['petani'] },
  { name: 'Katalog', icon: 'package', path: '/katalog', roles: ['petani', 'petugas', 'admin'] },
  { name: 'Pengguna', icon: 'users', path: '/pengguna', roles: ['admin'] },
];

const IconMap = {
  dashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  layout: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h18a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  image: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  shield: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  'credit-card': () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10c0 1.885 1.685 3.424 3 3.736V12c0 1.105-.894 2-2 2h-2c-1.105 0-2-.895-2-2v-.264c1.315-.312 3-1.851 3-3.736S10.685 6.264 12 6.264zM19 14a2 2 0 01-2 2H7a2 2 0 01-2-2v-3a2 2 0 012-2h3c.236 0 .464.011.688.046a2 2 0 01.688-.954A2 2 0 019.068 6h3c1.105 0 2 .895 2 2v3z" /></svg>,
  package: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  users: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2a3 3 0 015.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
};

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visibleItems = items.filter((item) => item.roles.includes(user?.role));
  const initial = user?.nama?.trim()?.[0]?.toUpperCase() || '?';

  const handleLogout = () => {
    logout();
    onClose?.();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full p-4 lg:p-5">
      <p className="px-3 mb-3 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
        Menu Utama
      </p>

      <nav className="space-y-1">
        {visibleItems.map((item) => {
          const Icon = IconMap[item.icon];
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-green-700 text-white shadow-md shadow-green-900/20'
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                }`
              }
              end
            >
              <Icon />
              <span>{item.name}</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.nama || 'Pengguna'}
              </p>
              <p className="text-[11px] text-gray-500 truncate">
                {roleLabels[user?.role] || 'Belum masuk'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 text-red-500" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}
