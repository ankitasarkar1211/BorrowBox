import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'borrowbox_token';

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY) || null,
  user: null,
  isInitialized: false,
  isLoading: false,

  setAuth: (user, token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    set({ user, token, isInitialized: true, isLoading: false });
  },

  setUser: (user) => set({ user }),

  updateCreditsBalance: (newBalance) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, creditsBalance: newBalance } });
    }
  },

  logout: (message) => {
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, token: null, isInitialized: true, isLoading: false });
    if (message) {
      toast.error(message);
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ user: null, token: null, isInitialized: true, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.success && response.data?.data?.user) {
        set({ user: response.data.data.user, token, isInitialized: true, isLoading: false });
      } else {
        get().logout();
      }
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;
      if (status === 403 && message?.toLowerCase().includes('deactivated')) {
        get().logout('Your account has been deactivated. Contact an administrator.');
      } else {
        get().logout();
      }
    }
  },
}));
