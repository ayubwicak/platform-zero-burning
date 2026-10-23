import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth, RequireAdmin, RequireRoles } from './components/RouteGuards';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profil from './pages/Profil';
import Fields from './pages/Fields';
import DataLahan from './pages/DataLahan';
import Upload from './pages/Upload';
import Verifikasi from './pages/Verifikasi';
import VerifikasiKomunitas from './pages/VerifikasiKomunitas';
import Distribusi from './pages/Distribusi';
import Klaim from './pages/Klaim';
import Katalog from './pages/Katalog';
import Pengguna from './pages/Pengguna';
import AuditLog from './pages/AuditLog';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profil" element={<Profil />} />
              <Route path="/katalog" element={<Katalog />} />
              <Route element={<RequireRoles roles={['petani']} />}>
                <Route path="/fields" element={<Fields />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/verifikasi-komunitas" element={<VerifikasiKomunitas />} />
                <Route path="/klaim" element={<Klaim />} />
              </Route>
              <Route element={<RequireRoles roles={['petugas', 'admin']} />}>
                <Route path="/data-lahan" element={<DataLahan />} />
                <Route path="/verifikasi" element={<Verifikasi />} />
                <Route path="/distribusi" element={<Distribusi />} />
              </Route>
              <Route element={<RequireAdmin />}>
                <Route path="/pengguna" element={<Pengguna />} />
                <Route path="/audit-log" element={<AuditLog />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
