// src/api/api.js
import axios from 'axios';

// En Cloudflare, VITE_API_URL será tu URL de Cloudflare
// Ejemplo: https://tu-proyecto.pages.dev
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor para incluir el token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;