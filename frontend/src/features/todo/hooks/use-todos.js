import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTodos, getTodo, createTodo, updateTodo, deleteTodo, updateTodoStatus } from '../api/todo-api';

export const TODO_QUERY_KEY = ['todos'];

export function useTodos(filters = {}) {
  const activeFilters = {};
  
  if (filters.status && filters.status !== 'all') {
    activeFilters.status = filters.status;
  }
  if (filters.categoryId) {
    activeFilters.categoryId = filters.categoryId;
  }
  if (filters.uncategorized) {
    activeFilters.uncategorized = true;
  }
  if (filters.overdue) {
    activeFilters.overdue = true;
  }
  
  return useQuery({
    queryKey: [...TODO_QUERY_KEY, activeFilters],
    queryFn: () => getTodos(activeFilters),
  });
}

export function useTodo(todoId) {
  return useQuery({
    queryKey: ['todo', todoId],
    queryFn: () => getTodo(todoId),
    enabled: !!todoId,
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TODO_QUERY_KEY }),
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ todoId, data }) => updateTodo(todoId, data),
    onSuccess: (updatedTodo, variables) => {
      queryClient.setQueryData(['todo', variables.todoId], updatedTodo);
      queryClient.invalidateQueries({ queryKey: TODO_QUERY_KEY });
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TODO_QUERY_KEY }),
  });
}

export function useUpdateTodoStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ todoId, status }) => updateTodoStatus(todoId, status),
    onSuccess: (updatedTodo, variables) => {
      queryClient.setQueryData(['todo', variables.todoId], updatedTodo);
      queryClient.invalidateQueries({ queryKey: TODO_QUERY_KEY });
    },
  });
}
