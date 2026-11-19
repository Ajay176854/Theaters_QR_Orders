import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach session info & auth token if available
api.interceptors.request.use(
  (config) => {
    const theaterId = sessionStorage.getItem('theaterId');
    if (theaterId) {
      config.headers['x-theater-id'] = theaterId;
    }

    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';

    console.error('[API Error]', message);
    return Promise.reject({ message, status: error.response?.status });
  }
);

export default api;
