import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoDetailModal } from './TodoDetailModal';
import { BrowserRouter } from 'react-router-dom';

const mockTodo = {
  id: 1,
  title: '테스트 할일',
  description: '설명',
  status: 'in_progress',
  dueDate: '2026-04-30',
  category: { id: 1, name: '업무' },
  isOverdue: false,
  createdAt: '2026-04-28T09:00:00Z',
  completedAt: null,
};

const renderWithProviders = (component) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('TodoDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('isOpen이 false일 때 렌더링되지 않는다', () => {
    const { container } = renderWithProviders(
      <TodoDetailModal todoId={1} isOpen={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('로딩 중일 때 로딩 스피너가 표시된다', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
          gcTime: 0,
        },
      },
    });
    
    queryClient.setQueryData(['todo', 1], undefined);
    
    render(
      <QueryClientProvider client={queryClient}>
        <TodoDetailModal todoId={1} isOpen={true} onClose={() => {}} />
      </QueryClientProvider>
    );
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  test('닫기 버튼이 표시된다', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
          gcTime: 0,
        },
      },
    });
    
    queryClient.setQueryData(['todo', 1], mockTodo);
    
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TodoDetailModal todoId={1} isOpen={true} onClose={() => {}} />
        </BrowserRouter>
      </QueryClientProvider>
    );
    
    expect(screen.getByRole('button', { name: /닫기/ })).toBeInTheDocument();
  });

  test('제목이 표시된다', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
          gcTime: 0,
        },
      },
    });
    
    queryClient.setQueryData(['todo', 1], mockTodo);
    
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TodoDetailModal todoId={1} isOpen={true} onClose={() => {}} />
        </BrowserRouter>
      </QueryClientProvider>
    );
    
    expect(screen.getByDisplayValue('테스트 할일')).toBeInTheDocument();
  });

  test('삭제 버튼이 표시된다', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
          gcTime: 0,
        },
      },
    });
    
    queryClient.setQueryData(['todo', 1], mockTodo);
    
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TodoDetailModal todoId={1} isOpen={true} onClose={() => {}} />
        </BrowserRouter>
      </QueryClientProvider>
    );
    
    expect(screen.getByRole('button', { name: /삭제/ })).toBeInTheDocument();
  });

  test('onClose가 호출된다', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
          gcTime: 0,
        },
      },
    });
    
    queryClient.setQueryData(['todo', 1], mockTodo);
    const onClose = vi.fn();
    
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TodoDetailModal todoId={1} isOpen={true} onClose={onClose} />
        </BrowserRouter>
      </QueryClientProvider>
    );
    
    fireEvent.click(screen.getByRole('button', { name: /닫기/ }));
    expect(onClose).toHaveBeenCalled();
  });
});