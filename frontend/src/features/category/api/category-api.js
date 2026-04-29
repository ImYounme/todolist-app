import { apiClient } from '../../../lib/api-client';

export async function getCategories() {
  const { data } = await apiClient.get('/api/categories');
  return data.data;
}

export async function createCategory({ name }) {
  const { data } = await apiClient.post('/api/categories', { name });
  return data.data;
}

export async function updateCategory(categoryId, { name }) {
  const { data } = await apiClient.patch(`/api/categories/${categoryId}`, { name });
  return data.data;
}

export async function deleteCategory(categoryId) {
  const { data } = await apiClient.delete(`/api/categories/${categoryId}`);
  return data.data;
}
