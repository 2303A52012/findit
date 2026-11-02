import axios from 'axios';

// In production, fallback to relative '/api' if VITE_API_URL is not set
const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: apiBase
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('findit_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => Promise.reject(error.response?.data?.message ? new Error(error.response.data.message) : error)
);

export default api;
