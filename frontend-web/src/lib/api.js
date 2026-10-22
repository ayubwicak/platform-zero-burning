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
    if (error.response?.status === 401) {
      [localStorage, sessionStorage].forEach((storage) => {
        storage.removeItem('zb_token');
        storage.removeItem('zb_user');
      });
      window.dispatchEvent(new Event('zb:logout'));
    }
    return Promise.reject(error);
  }
);

export default api;
