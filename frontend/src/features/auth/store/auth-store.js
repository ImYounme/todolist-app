import { create } from 'zustand';

const AUTH_TOKEN_KEY = 'auth_token';

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export const useAuthStore = create((set) => ({
  token: localStorage.getItem(AUTH_TOKEN_KEY),
  setToken: (token) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    set({ token });
  },
  clearToken: () => {
    clearAuthToken();
    set({ token: null });
  },
}));
