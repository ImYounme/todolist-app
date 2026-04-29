import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, test, vi } from 'vitest';
import TodoListPage from '../pages/TodoListPage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';

// Mocking required hooks and stores
vi.mock('../features/auth/store/auth-store', () => ({
  useAuthStore: vi.fn((selector) => selector({ clearToken: vi.fn() })),
}));

vi.mock('../features/todo/store/todo-store', () => ({
  useTodoStore: vi.fn(() => ({
    isCreateModalOpen: false,
    setIsCreateModalOpen: vi.fn(),
    selectedTodoId: null,
    setSelectedTodoId: vi.fn(),
    selectedCategoryId: null,
    selectedStatusTab: 'all',
    showUncategorized: false,
    showOverdue: false,
    resetFilters: vi.fn(),
  })),
}));

vi.mock('../features/category/store/category-store', () => ({
  useCategoryStore: vi.fn(() => ({
    isManageModalOpen: false,
    setIsManageModalOpen: vi.fn(),
  })),
}));

vi.mock('../features/todo/hooks/use-todos', () => ({
  useTodos: vi.fn(() => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() })),
}));

vi.mock('../features/category/hooks/use-categories', () => ({
  useCategories: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('../features/auth/hooks/use-auth', () => ({
  useLogin: vi.fn(() => ({ mutate: vi.fn(), isPending: false, error: null })),
  useSignup: vi.fn(() => ({ mutate: vi.fn(), isPending: false, error: null })),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithRouter = (ui) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Logo Navigation', () => {
  test('TodoList logo in TodoListPage is a link to root', () => {
    renderWithRouter(<TodoListPage />);
    const logoLink = screen.getByRole('link', { name: /TodoList/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
  });

  test('TodoList logo in LoginPage is a link to root', () => {
    renderWithRouter(<LoginPage />);
    const logoLink = screen.getByRole('link', { name: /TodoList/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
  });

  test('TodoList logo in SignupPage is a link to root', () => {
    renderWithRouter(<SignupPage />);
    const logoLink = screen.getByRole('link', { name: /TodoList/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
  });
});
