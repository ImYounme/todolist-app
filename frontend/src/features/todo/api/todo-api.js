import { apiClient } from '../../../lib/api-client';

export async function getTodos(filters = {}) {
  const { data } = await apiClient.get('/api/todos', { params: filters });
  return data.data;
}

export async function getTodo(todoId) {
  const { data } = await apiClient.get(`/api/todos/${todoId}`);
  return data.data;
}

export async function createTodo(todoData) {
  const { data } = await apiClient.post('/api/todos', todoData);
  return data.data;
}

export async function updateTodo(todoId, updateData) {
  const { data } = await apiClient.patch(`/api/todos/${todoId}`, updateData);
  return data.data;
}

export async function deleteTodo(todoId) {
  await apiClient.delete(`/api/todos/${todoId}`);
}

export async function updateTodoStatus(todoId, status) {
  const { data } = await apiClient.patch(`/api/todos/${todoId}/status`, { status });
  return data.data;
}
