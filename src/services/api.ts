import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

// Función para obtener el token desde localStorage o sessionStorage
const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
};

// Agregar el token a todas las solicitudes
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Limpiar tokens si hay error de autenticación
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      // Si estamos en una ruta protegida, redirigir al login
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
