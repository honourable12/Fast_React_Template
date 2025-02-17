import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 422) {
      const validationErrors = error.response.data.detail;
      if (Array.isArray(validationErrors)) {
        validationErrors.forEach((err) => {
          toast.error(`${err.loc.join('.')}: ${err.msg}`);
        });
      } else {
        toast.error(error.response.data.detail || 'Validation error');
      }
    } else if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status === 500) {
      toast.error('Internal server error. Please try again later.');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;