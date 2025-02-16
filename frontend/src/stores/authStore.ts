import { create } from 'zustand';
import axios from '../lib/axios';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  getProfile: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<string>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const { data } = await axios.post<AuthResponse>('/auth/token', credentials);
      localStorage.setItem('token', data.access_token);
      set({ isAuthenticated: true });
      await useAuthStore.getState().getProfile();
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      await axios.post('/auth/register', data);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false });
  },

  getProfile: async () => {
    try {
      const { data } = await axios.get<User>('/auth/profile');
      set({ user: data, isAuthenticated: true });
    } catch (error) {
      set({ user: null, isAuthenticated: false });
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    await axios.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  resetPassword: async (email) => {
    const { data } = await axios.post<{ temp_password: string }>('/auth/reset-password', { email });
    return data.temp_password;
  },

  deleteAccount: async () => {
    await axios.delete('/auth/delete-account');
    useAuthStore.getState().logout();
  },
}));