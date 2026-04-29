import { apiClient } from '../../../lib/api-client';

export async function login({ email, password }) {
  const { data } = await apiClient.post('/api/auth/login', { email, password });
  return data.data;
}

export async function signup({ email, password }) {
  const { data } = await apiClient.post('/api/auth/signup', { email, password });
  return data.data;
}

export async function getProfile() {
  const { data } = await apiClient.get('/api/profile');
  return data.data;
}
