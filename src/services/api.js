import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Ocurrió un error. Intenta nuevamente.';
    return Promise.reject(new Error(message));
  }
);

export default api;
