import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { CategoryManageModal } from './CategoryManageModal';

const mockCategories = [
  { id: 1, name: '업무', createdAt: '2026-04-28T09:00:00Z' },
  { id: 2, name: '개인', createdAt: '2026-04-28T09:00:00Z' },
];

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

describe('CategoryManageModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('isOpen이 false일 때 렌더링되지 않는다', () => {
    const { container } = renderWithProviders(
      <CategoryManageModal isOpen={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('제목과 추가 폼이 표시된다', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    queryClient.setQueryData(['categories'], mockCategories);
    
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CategoryManageModal isOpen={true} onClose={() => {}} />
        </BrowserRouter>
      </QueryClientProvider>
    );
    
    expect(screen.getByText('카테고리 관리')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('새 카테고리 이름')).toBeInTheDocument();
  });

  test('카테고리 목록이 표시된다', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
    
    queryClient.setQueryData(['categories'], mockCategories);
    
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CategoryManageModal isOpen={true} onClose={() => {}} />
        </BrowserRouter>
      </QueryClientProvider>
    );
    
    expect(screen.getByText('업무')).toBeInTheDocument();
    expect(screen.getByText('개인')).toBeInTheDocument();
  });

  test('수정, 삭제 버튼이 표시된다', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
    
    queryClient.setQueryData(['categories'], mockCategories);
    
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CategoryManageModal isOpen={true} onClose={() => {}} />
        </BrowserRouter>
      </QueryClientProvider>
    );
    
    expect(screen.getAllByText('수정')).toHaveLength(2);
    expect(screen.getAllByText('삭제')).toHaveLength(2);
  });

  test('카테고리 수와 한도가 표시된다', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
    
    queryClient.setQueryData(['categories'], mockCategories);
    
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CategoryManageModal isOpen={true} onClose={() => {}} />
        </BrowserRouter>
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/카테고리 2 \/ 20/)).toBeInTheDocument();
  });

  test('onClose가 호출된다', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
    
    queryClient.setQueryData(['categories'], mockCategories);
    const onClose = vi.fn();
    
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CategoryManageModal isOpen={true} onClose={onClose} />
        </BrowserRouter>
      </QueryClientProvider>
    );
    
    fireEvent.click(screen.getByRole('button', { name: /닫기/ }));
    expect(onClose).toHaveBeenCalled();
  });
});