import axios from 'axios';

// URL del backend configurable por entorno (frontend/.env → VITE_API_URL).
// Si no está definida, cae de vuelta a '/api' relativo (útil solo cuando
// algo delante del frontend —como el proxy de `vite dev`— reenvía esa ruta).
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
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
