import { create } from 'zustand';
import { User } from '../types/auth';
import axiosInstance from '../lib/axios';
import { toast } from 'react-hot-toast';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  getProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (username, password) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axiosInstance.post('/auth/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      localStorage.setItem('token', response.data.access_token);

      // Fetch user profile after successful login
      const profileResponse = await axiosInstance.get('/auth/profile');
      set({ user: profileResponse.data, isAuthenticated: true });
    } catch (error: any) {
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false });
      throw error;
    }
  },

  register: async (data) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', data.username);
      formData.append('password', data.password);
      formData.append('email', data.email);
      formData.append('full_name', data.full_name);
      formData.append('role', 'user'); // Default role

      const response = await axiosInstance.post('/auth/register', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 201 || response.status === 200) {
        toast.success('Registration successful! Please login.');
        return response.data;
      }
      throw new Error('Registration failed');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Registration failed';
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false });
  },

  getProfile: async () => {
    try {
      const response = await axiosInstance.get('/auth/profile');
      set({ user: response.data, isAuthenticated: true });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false });
    }
  },
}));