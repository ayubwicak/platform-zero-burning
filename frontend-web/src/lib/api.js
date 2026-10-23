import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zb_token') || sessionStorage.getItem('zb_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.error;

      // Clear auth data
      [localStorage, sessionStorage].forEach((storage) => {
        storage.removeItem('zb_token');
        storage.removeItem('zb_user');
      });

      // Dispatch logout event
      window.dispatchEvent(new Event('zb:logout'));

      // Set logout reason untuk ditampilkan di login page
      if (errorCode === 'TOKEN_EXPIRED') {
        sessionStorage.setItem('zb_logout_reason', 'Sesi Anda telah berakhir. Silakan login kembali.');
      } else if (errorCode === 'TOKEN_INVALID') {
        sessionStorage.setItem('zb_logout_reason', 'Sesi tidak valid. Silakan login kembali.');
      } else if (errorMessage?.includes('dinonaktifkan')) {
        sessionStorage.setItem('zb_logout_reason', errorMessage);
      } else {
        sessionStorage.setItem('zb_logout_reason', errorMessage || 'Sesi Anda berakhir. Silakan login kembali.');
      }

      // Redirect ke login jika tidak sudah di sana
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Handle 403 Forbidden (akses ditolak)
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.error;
      if (errorMessage?.includes('role')) {
        sessionStorage.setItem('zb_error_message', 'Anda tidak memiliki akses ke halaman ini.');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
