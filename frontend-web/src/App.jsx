import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth, RequireAdmin, RequireRoles } from './components/RouteGuards';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Fields from './pages/Fields';
import Upload from './pages/Upload';
import Verifikasi from './pages/Verifikasi';
import Klaim from './pages/Klaim';
import Katalog from './pages/Katalog';
import Pengguna from './pages/Pengguna';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/katalog" element={<Katalog />} />
              <Route element={<RequireRoles roles={['petani']} />}>
                <Route path="/fields" element={<Fields />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/klaim" element={<Klaim />} />
              </Route>
              <Route element={<RequireRoles roles={['petugas', 'admin']} />}>
                <Route path="/verifikasi" element={<Verifikasi />} />
              </Route>
              <Route element={<RequireAdmin />}>
                <Route path="/pengguna" element={<Pengguna />} />
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
